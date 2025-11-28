'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scholarshipsApi, scholarshipApplicationsApi } from '@/lib/api/scholarships';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const STATUS_LABELS = {
  draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-700', icon: Clock },
  submitted: { label: 'Gönderildi', color: 'bg-blue-100 text-blue-700', icon: FileText },
  under_review: { label: 'İncelemede', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700', icon: XCircle },
  waitlisted: { label: 'Beklemede', color: 'bg-orange-100 text-orange-700', icon: Clock },
};

export default function ScholarshipApplicationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Get all scholarships for filter
  const { data: scholarshipsData } = useQuery({
    queryKey: ['scholarships'],
    queryFn: () => scholarshipsApi.list({ isActive: true }),
  });

  // Get applications
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['scholarship-applications', statusFilter, scholarshipFilter],
    queryFn: () =>
      scholarshipApplicationsApi.list({
        limit: 100,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        scholarship_id:
          scholarshipFilter !== 'all' ? scholarshipFilter : undefined,
      }),
  });

  // Update application mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted'; reviewed_at?: string; [key: string]: unknown } }) =>
      scholarshipApplicationsApi.update(id, data as { status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted'; reviewed_at?: string; reviewed_by?: string; submitted_at?: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarship-applications'] });
      toast.success('Başvuru güncellendi');
      setIsDetailDialogOpen(false);
    },
    onError: (error: Error | { message?: string }) => {
      toast.error(error instanceof Error ? error.message : error.message || 'Başvuru güncellenirken hata oluştu');
    },
  });

  const applications = applicationsData?.data || [];
  const scholarships = scholarshipsData?.data || [];

  // Filter applications by search
  const filteredApplications = useMemo(() => {
    if (!search) return applications;
    const searchLower = search.toLowerCase();
    return applications.filter(
      (app: { applicant_name?: string; university?: string; department?: string; applicant_email?: string; [key: string]: unknown }) =>
        app.applicant_name?.toLowerCase().includes(searchLower) ||
        app.university?.toLowerCase().includes(searchLower) ||
        app.department?.toLowerCase().includes(searchLower) ||
        app.applicant_email?.toLowerCase().includes(searchLower)
    );
  }, [applications, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter((a: { status?: string; [key: string]: unknown }) => a.status === 'submitted').length;
    const underReview = applications.filter((a: { status?: string; [key: string]: unknown }) => a.status === 'under_review').length;
    const approved = applications.filter((a: { status?: string; [key: string]: unknown }) => a.status === 'approved').length;
    const rejected = applications.filter((a: { status?: string; [key: string]: unknown }) => a.status === 'rejected').length;

    return { total, submitted, underReview, approved, rejected };
  }, [applications]);

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateMutation.mutate({
      id: applicationId,
      data: {
        status: newStatus as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted',
        reviewed_at: new Date().toISOString(),
      },
    });
  };

  const getScholarshipTitle = (scholarshipId: string) => {
    const scholarship = scholarships.find((s: { _id?: string; $id?: string; title?: string; [key: string]: unknown }) => (s._id || s.$id) === scholarshipId);
    return scholarship && 'title' in scholarship ? (scholarship.title as string) : 'Bilinmeyen Program';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Burs Başvuruları</h1>
        <p className="text-slate-600 mt-1">Burs başvurularını inceleyin ve değerlendirin</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Toplam Başvuru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gönderildi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">İncelemede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Onaylanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Reddedilen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Ad, üniversite veya bölüm ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="submitted">Gönderildi</SelectItem>
                <SelectItem value="under_review">İncelemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
                <SelectItem value="waitlisted">Beklemede</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scholarshipFilter} onValueChange={setScholarshipFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Burs Programı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Programlar</SelectItem>
                {scholarships.map((scholarship: { _id?: string; $id?: string; title?: string; [key: string]: unknown }) => {
                  const scholarshipId = scholarship._id || scholarship.$id || '';
                  return (
                  <SelectItem key={scholarshipId} value={scholarshipId}>
                    {scholarship.title || 'Bilinmeyen'}
                  </SelectItem>
                );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Başvurular ({filteredApplications.length})</CardTitle>
          <CardDescription>Burs başvurularının listesi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Başvuru bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başvuran</TableHead>
                  <TableHead>Burs Programı</TableHead>
                  <TableHead>Üniversite</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application: { _id?: string; $id?: string; status?: string; applicant_name?: string; applicant_phone?: string; scholarship_id?: string; university?: string; department?: string; gpa?: number; priority_score?: number; submitted_at?: string; [key: string]: unknown }) => {
                  const statusInfo =
                    STATUS_LABELS[(application.status || 'draft') as keyof typeof STATUS_LABELS];
                  const StatusIcon = statusInfo.icon;
                  const appId = application._id || application.$id || '';

                  return (
                    <TableRow key={appId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.applicant_name || '-'}</div>
                          <div className="text-sm text-slate-500">
                            {application.applicant_phone || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getScholarshipTitle(application.scholarship_id || '')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{application.university || '-'}</div>
                          <div className="text-xs text-slate-500">
                            {application.department || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.gpa && typeof application.gpa === 'number' ? (
                          <span className="font-medium">{application.gpa.toFixed(2)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {application.priority_score ? (
                          <Badge variant="outline" className="font-mono">
                            {String(application.priority_score)}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {application.submitted_at && typeof application.submitted_at === 'string'
                            ? new Date(application.submitted_at).toLocaleDateString('tr-TR')
                            : 'Henüz gönderilmedi'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication({ ...application, _id: appId });
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Başvuru Detayları</DialogTitle>
            <DialogDescription>
              {selectedApplication?.applicant_name} -{' '}
              {getScholarshipTitle(selectedApplication?.scholarship_id)}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <Label htmlFor="status-select" className="font-medium min-w-[100px]">
                  Durum:
                </Label>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => handleStatusChange(selectedApplication._id || selectedApplication.$id || '', value)}
                >
                  <SelectTrigger id="status-select" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="submitted">Gönderildi</SelectItem>
                    <SelectItem value="under_review">İncelemede</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
                    <SelectItem value="waitlisted">Beklemede</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="font-semibold mb-3">Kişisel Bilgiler</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Ad Soyad:</span>
                    <p className="font-medium">{selectedApplication.applicant_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Telefon:</span>
                    <p className="font-medium">{selectedApplication.applicant_phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">E-posta:</span>
                    <p className="font-medium">{selectedApplication.applicant_email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Öncelik Puanı:</span>
                    <p className="font-medium">{selectedApplication.priority_score || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <h3 className="font-semibold mb-3">Akademik Bilgiler</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Üniversite:</span>
                    <p className="font-medium">{selectedApplication.university || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Bölüm:</span>
                    <p className="font-medium">{selectedApplication.department || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Sınıf:</span>
                    <p className="font-medium">{selectedApplication.grade_level || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">GPA:</span>
                    <p className="font-medium">
                      {selectedApplication.gpa ? selectedApplication.gpa.toFixed(2) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Akademik Yıl:</span>
                    <p className="font-medium">{selectedApplication.academic_year || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Family & Financial Info */}
              <div>
                <h3 className="font-semibold mb-3">Aile ve Ekonomik Durum</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Aylık Gelir:</span>
                    <p className="font-medium">
                      {selectedApplication.monthly_income
                        ? `₺${selectedApplication.monthly_income.toLocaleString('tr-TR')}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Aile Geliri:</span>
                    <p className="font-medium">
                      {selectedApplication.family_income
                        ? `₺${selectedApplication.family_income.toLocaleString('tr-TR')}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Baba Mesleği:</span>
                    <p className="font-medium">{selectedApplication.father_occupation || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Anne Mesleği:</span>
                    <p className="font-medium">{selectedApplication.mother_occupation || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Kardeş Sayısı:</span>
                    <p className="font-medium">{selectedApplication.sibling_count || '-'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-600">Yetim:</span>
                      <p className="font-medium">
                        {selectedApplication.is_orphan ? 'Evet' : 'Hayır'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Engelli:</span>
                      <p className="font-medium">
                        {selectedApplication.has_disability ? 'Evet' : 'Hayır'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Essay */}
              {selectedApplication.essay && (
                <div>
                  <h3 className="font-semibold mb-3">Motivasyon Mektubu</h3>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedApplication.essay}
                  </div>
                </div>
              )}

              {/* Reviewer Notes */}
              {selectedApplication.reviewer_notes && (
                <div>
                  <h3 className="font-semibold mb-3">İnceleyen Notları</h3>
                  <div className="p-4 bg-yellow-50 rounded-lg text-sm">
                    {selectedApplication.reviewer_notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
