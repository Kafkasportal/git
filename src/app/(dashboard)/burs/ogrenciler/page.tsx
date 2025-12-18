'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { scholarshipApplicationsApi, scholarshipsApi } from '@/lib/api/client';
import { StudentForm } from '@/components/forms/StudentForm';
import type { StudentFormValues } from '@/lib/validations/student';
import {
  Search,
  Filter,
  GraduationCap,
  Users,
  CreditCard,
  TrendingUp,
  Download,
  Plus,
  Eye,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

// Define the type based on what the API returns
interface ScholarshipApplication {
  $id: string;
  applicant_name: string;
  applicant_tc_no: string;
  applicant_phone: string;
  applicant_email?: string;
  university?: string;
  department?: string;
  grade_level?: string;
  gpa?: number;
  status: string;
  scholarship_id: string;
  scholarship?: {
    title: string;
    amount: number;
  };
  created_at?: string;
  updated_at?: string;
}

const STATUS_LABELS = {
  draft: { label: 'Taslak', variant: 'secondary' as const },
  submitted: { label: 'Başvuru Gönderildi', variant: 'info' as const },
  under_review: { label: 'İncelemede', status: 'pending' as const },
  approved: { label: 'Onaylandı', status: 'active' as const },
  rejected: { label: 'Reddedildi', status: 'error' as const },
  waitlisted: { label: 'Beklemede', variant: 'warning' as const },
};

const GRADE_LABELS = {
  hazirlik: 'Hazırlık',
  '1': '1. Sınıf',
  '2': '2. Sınıf',
  '3': '3. Sınıf',
  '4': '4. Sınıf',
  '5': '5. Sınıf',
  '6': '6. Sınıf',
};

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const limit = 50;
  const queryClient = useQueryClient();

  // Fetch applications
  const { data: applicationsResponse, isLoading } = useQuery({
    queryKey: ['scholarship-applications', page, search, statusFilter],
    queryFn: async () => {
      const res = await scholarshipApplicationsApi.list({
        limit,
        skip: (page - 1) * limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        // search param is not directly supported by list but we can filter client side or add support later
      });
      if (!res.success) throw new Error(res.error || 'Failed to fetch applications');
      return res;
    },
  });

  // Fetch scholarships map for titles
  const { data: scholarshipsResponse } = useQuery({
    queryKey: ['scholarships', 'map'],
    queryFn: async () => {
      const res = await scholarshipsApi.list({ limit: 100 });
      if (!res.success) return [];
      return res.data;
    },
  });

  interface ScholarshipItem {
    $id: string;
    title?: string;
    amount?: number;
    student_name?: string;
    scholarship_amount?: number;
  }

  const scholarshipsMap = useMemo(() => {
    const map: Record<string, { title: string; amount: number }> = {};
    if (scholarshipsResponse) {
      (scholarshipsResponse as unknown as ScholarshipItem[]).forEach((s) => {
        // Support both field naming conventions: title/amount or student_name/scholarship_amount
        const title = s.title || s.student_name || '';
        const amount = s.amount || s.scholarship_amount || 0;
        if (s.$id && (title || amount > 0)) {
          map[s.$id] = { title, amount };
        }
      });
    }
    return map;
  }, [scholarshipsResponse]);

  const applications = (applicationsResponse?.data || []) as unknown as ScholarshipApplication[];
  const total = applicationsResponse?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const memoizedStudents: ScholarshipApplication[] = useMemo(() => {
    let filtered = applications.map((app) => ({
      ...app,
      scholarship: scholarshipsMap[app.scholarship_id],
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.applicant_name.toLowerCase().includes(searchLower) ||
          s.applicant_tc_no.includes(search) ||
          s.university?.toLowerCase().includes(searchLower)
      );
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter((s) => s.grade_level === gradeFilter);
    }

    return filtered;
  }, [applications, search, gradeFilter, scholarshipsMap]);

  const visibleTotal = memoizedStudents.length;

  // Calculate statistics
  const stats = useMemo(() => {
    const approvedStudents = memoizedStudents.filter((s) => s.status === 'approved');
    const totalScholarshipAmount = approvedStudents.reduce(
      (sum, s) => sum + (s.scholarship?.amount || 0),
      0
    );
    // Mock total paid for now as we don't have payments linked here yet
    const totalPaid = 0;
    const averageGPA =
      approvedStudents.length > 0
        ? approvedStudents.reduce((sum, s) => sum + (s.gpa || 0), 0) / approvedStudents.length
        : 0;

    return {
      totalStudents: total,
      approvedStudents: approvedStudents.length,
      totalScholarshipAmount,
      totalPaid,
      averageGPA: averageGPA.toFixed(2),
      pendingReview: memoizedStudents.filter((s) => s.status === 'under_review').length,
    };
  }, [memoizedStudents, total]);

  const createMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      const res = await scholarshipApplicationsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create application');
      return res.data;
    },
    onSuccess: () => {
      toast.success('Öğrenci başarıyla eklendi');
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['scholarship-applications'] }).catch(() => {
        // Ignore errors from query invalidation
      });
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleAddStudent = async (data: StudentFormValues) => {
    await createMutation.mutateAsync(data);
  };

  const handleExportExcel = useCallback(() => {
    const csvContent = [
      ['Rapor Türü', 'Öğrenci Burs Listesi'],
      ['Tarih', new Date().toLocaleDateString('tr-TR')],
      [''],
      ['ÖĞRENCI LİSTESİ'],
      [
        'Ad Soyad',
        'TC No',
        'Telefon',
        'Email',
        'Üniversite',
        'Bölüm',
        'Sınıf',
        'GPA',
        'Durum',
        'Burs Programı',
        'Burs Tutarı',
      ],
      ...memoizedStudents.map((student) => [
        student.applicant_name,
        student.applicant_tc_no,
        student.applicant_phone,
        student.applicant_email || '',
        student.university || '',
        student.department || '',
        GRADE_LABELS[student.grade_level as keyof typeof GRADE_LABELS] || student.grade_level || '',
        student.gpa?.toFixed(2) || '',
        STATUS_LABELS[student.status as keyof typeof STATUS_LABELS]?.label || student.status,
        student.scholarship?.title || '',
        (student.scholarship?.amount || 0).toLocaleString('tr-TR'),
      ]),
    ];

    const csv = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ogrenci-burs-listesi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Öğrenci listesi Excel formatında indirildi');
  }, [memoizedStudents]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Öğrenci Listesi</h1>
          <p className="text-muted-foreground mt-2">
            Burs alan öğrencileri görüntüleyin ve yönetin
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {['stats-1', 'stats-2', 'stats-3', 'stats-4'].map((key) => (
            <Card key={key}>
              <CardHeader>
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Öğrenci Listesi</h1>
          <p className="text-muted-foreground mt-2">
            Burs alan öğrencileri görüntüleyin ve yönetin
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Öğrenci
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
                <DialogDescription>Burs başvurusu yapan yeni bir öğrenci ekleyin</DialogDescription>
              </DialogHeader>
              <StudentForm onSubmit={handleAddStudent} isLoading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı öğrenci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Burslar</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Onaylı öğrenci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Burs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalScholarshipAmount.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aylık toplam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama GPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGPA}</div>
            <p className="text-xs text-muted-foreground mt-1">Onaylı öğrenciler</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Arama ve Filtreleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ad, TC No veya Üniversite"
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="submitted">Başvuru Gönderildi</SelectItem>
                <SelectItem value="under_review">İncelemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
                <SelectItem value="waitlisted">Beklemede</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm Sınıflar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sınıflar</SelectItem>
                <SelectItem value="hazirlik">Hazırlık</SelectItem>
                <SelectItem value="1">1. Sınıf</SelectItem>
                <SelectItem value="2">2. Sınıf</SelectItem>
                <SelectItem value="3">3. Sınıf</SelectItem>
                <SelectItem value="4">4. Sınıf</SelectItem>
                <SelectItem value="5">5. Sınıf</SelectItem>
                <SelectItem value="6">6. Sınıf</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Öğrenci Listesi</CardTitle>
          <CardDescription>Toplam {visibleTotal} öğrenci kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          {memoizedStudents.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Öğrenci bulunamadı</p>
              <p className="text-sm mt-2">
                {search ? 'Arama kriterlerinize uygun öğrenci yok' : 'Henüz öğrenci eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {memoizedStudents.map((student) => (
                <div
                  key={student.$id}
                  className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{student.applicant_name}</h3>
                        <Badge
                          {...(() => {
                            const statusConfig = STATUS_LABELS[student.status as keyof typeof STATUS_LABELS];
                            if (!statusConfig) return {};
                            if ('variant' in statusConfig) {
                              return { variant: statusConfig.variant };
                            }
                            if ('status' in statusConfig) {
                              return { status: statusConfig.status };
                            }
                            return {};
                          })()}
                        >
                          {STATUS_LABELS[student.status as keyof typeof STATUS_LABELS]?.label ||
                            student.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">TC No:</span>
                          <p className="font-medium">{student.applicant_tc_no}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Telefon:</span>
                          <p className="font-medium">{student.applicant_phone}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{student.applicant_email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">GPA:</span>
                          <p className="font-medium">{student.gpa?.toFixed(2) || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Üniversite:</span>
                          <p className="font-medium">{student.university || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bölüm:</span>
                          <p className="font-medium">{student.department || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sınıf:</span>
                          <p className="font-medium">
                            {GRADE_LABELS[student.grade_level as keyof typeof GRADE_LABELS] || '-'}
                          </p>
                        </div>
                      </div>

                      {student.scholarship && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-green-800 dark:text-green-200">
                                {student.scholarship.title}
                              </h4>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Aylık: {(student.scholarship.amount || 0).toLocaleString('tr-TR')} ₺
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/burs/ogrenciler/${student.$id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-4 w-4" />
                          Görüntüle
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sayfa {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
