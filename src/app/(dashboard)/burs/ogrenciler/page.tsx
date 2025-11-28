'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { apiClient as api } from '@/lib/api/api-client';
import type { AidApplicationDocument } from '@/types/database';
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

interface StudentRecord {
  _id: string;
  applicant_name: string;
  applicant_tc_no: string;
  applicant_phone: string;
  applicant_email?: string;
  university?: string;
  department?: string;
  grade_level?: string;
  gpa?: number;
  academic_year?: string;
  monthly_income?: number;
  family_income?: number;
  father_occupation?: string;
  mother_occupation?: string;
  sibling_count?: number;
  is_orphan?: boolean;
  has_disability?: boolean;
  status: string;
  priority_score?: number;
  submitted_at?: string;
  scholarship_id: string;
  scholarship_title?: string;
  scholarship_amount?: number;
  total_paid?: number;
  last_payment_date?: string;
}

const STATUS_LABELS = {
  draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Başvuru Gönderildi', color: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'İncelemede', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
  waitlisted: { label: 'Beklemede', color: 'bg-orange-100 text-orange-700' },
};

const GRADE_LABELS = {
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

  const { data: applicationsResponse, isLoading } = useQuery({
    queryKey: ['scholarship-students', page, search, statusFilter],
    queryFn: async () => {
      const response = await api.aidApplications.getAidApplications({
        page,
        limit,
        search,
        filters: {
          stage: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      return response;
    },
  });

  const applications = (applicationsResponse?.data ?? []) as AidApplicationDocument[];
  const total = applicationsResponse?.total ?? applications.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const memoizedStudents: StudentRecord[] = useMemo(() => {
    const normalized: StudentRecord[] = applications.map((application) => ({
      _id: application._id || application.$id || '',
      applicant_name: application.applicant_name,
      applicant_tc_no: '',
      applicant_phone: '',
      applicant_email: undefined,
      university: undefined,
      department: undefined,
      grade_level: undefined,
      gpa: undefined,
      academic_year: undefined,
      monthly_income: application.regular_financial_aid,
      family_income: undefined,
      father_occupation: undefined,
      mother_occupation: undefined,
      sibling_count: undefined,
      is_orphan: undefined,
      has_disability: undefined,
      status: application.stage,
      priority_score: undefined,
      submitted_at: application.application_date,
      scholarship_id: application.beneficiary_id || '',
      scholarship_title: undefined,
      scholarship_amount: application.one_time_aid,
      total_paid: undefined,
      last_payment_date: application.completed_at,
    }));

    return normalized.filter((student) => {
      const matchesGrade = gradeFilter === 'all' || student.grade_level === gradeFilter;
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesSearch =
        !search || student.applicant_name.toLowerCase().includes(search.toLowerCase());
      return matchesGrade && matchesStatus && matchesSearch;
    });
  }, [applications, gradeFilter, statusFilter, search]);

  const visibleTotal = memoizedStudents.length;

  // Calculate statistics
  const stats = useMemo(() => {
    const approvedStudents = memoizedStudents.filter((s) => s.status === 'approved');
    const totalScholarshipAmount = approvedStudents.reduce(
      (sum, s) => sum + (s.scholarship_amount || 0),
      0
    );
    const totalPaid = approvedStudents.reduce((sum, s) => sum + (s.total_paid || 0), 0);
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

  const handleExportExcel = () => {
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
        'Puan',
        'Burs Tutarı',
        'Ödenen',
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
        student.priority_score?.toString() || '',
        (student.scholarship_amount || 0).toLocaleString('tr-TR'),
        (student.total_paid ?? 0).toLocaleString('tr-TR'),
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
  };

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
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
                <DialogDescription>Burs başvurusu yapan yeni bir öğrenci ekleyin</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-center text-muted-foreground py-8">
                  Yeni öğrenci ekleme formu geliştirilme aşamasındadır.
                </p>
              </div>
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
                  key={student._id}
                  className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{student.applicant_name}</h3>
                        <Badge
                          className={
                            STATUS_LABELS[student.status as keyof typeof STATUS_LABELS]?.color
                          }
                        >
                          {STATUS_LABELS[student.status as keyof typeof STATUS_LABELS]?.label}
                        </Badge>
                        {student.is_orphan && <Badge variant="secondary">Yetim</Badge>}
                        {student.has_disability && <Badge variant="secondary">Engelli</Badge>}
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
                        <div>
                          <span className="text-muted-foreground">Öncelik Puanı:</span>
                          <p className="font-medium">{student.priority_score || '-'}</p>
                        </div>
                      </div>

                      {student.scholarship_title && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-green-800 dark:text-green-200">
                                {student.scholarship_title}
                              </h4>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Aylık: {(student.scholarship_amount || 0).toLocaleString('tr-TR')} ₺
                              </p>
                            </div>
                            {(student.total_paid ?? 0) > 0 && (
                              <div className="text-right">
                                <p className="text-sm text-green-600 dark:text-green-300">
                                  Toplam Ödenen
                                </p>
                                <p className="font-semibold text-green-800 dark:text-green-200">
                                  {(student.total_paid ?? 0).toLocaleString('tr-TR')} ₺
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-4 w-4" />
                        Görüntüle
                      </Button>
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
