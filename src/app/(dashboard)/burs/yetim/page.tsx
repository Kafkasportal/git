'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scholarshipApplicationsApi, scholarshipPaymentsApi } from '@/lib/api/scholarships';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Heart, Users, TrendingUp, Calendar, Eye, CreditCard } from 'lucide-react';

const STATUS_LABELS = {
  draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Başvuru Yapıldı', color: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'İncelemede', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aktif Destek', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
  waitlisted: { label: 'Beklemede', color: 'bg-orange-100 text-orange-700' },
};

export default function OrphansPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrphan, setSelectedOrphan] = useState<{
    _id?: string;
    $id?: string;
    applicant_name?: string;
    status?: string;
    priority_score?: number;
    applicant_phone?: string;
    applicant_email?: string;
    university?: string;
    department?: string;
    grade_level?: string;
    gpa?: number;
    academic_year?: string;
    mother_occupation?: string;
    father_occupation?: string;
    sibling_count?: number;
    has_disability?: boolean;
    monthly_income?: number;
    family_income?: number;
    essay?: string;
    [key: string]: unknown;
  } | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Get all applications where is_orphan=true
  const { data: orphansData, isLoading } = useQuery({
    queryKey: ['orphan-students', statusFilter],
    queryFn: async () => {
      // Get all applications
      const response = await scholarshipApplicationsApi.list({
        limit: 1000,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      // Filter for orphans only
      const orphans = response.data?.filter((app: { is_orphan?: boolean; [key: string]: unknown }) => app.is_orphan === true) || [];

      return {
        ...response,
        data: orphans,
      };
    },
    initialData: { success: false, data: [], total: 0, error: null },
  });

  // Get payments for selected orphan
  const { data: paymentsData } = useQuery({
    queryKey: ['orphan-payments', selectedOrphan?._id],
    queryFn: () =>
      selectedOrphan
        ? scholarshipPaymentsApi.list({
            application_id: selectedOrphan._id,
          })
        : Promise.resolve({ success: false, data: [], total: 0, error: null }),
    enabled: !!selectedOrphan,
    initialData: { success: false, data: [], total: 0, error: null },
  });

  const orphans = orphansData?.data || [];
  const payments = paymentsData?.data || [];

  // Filter orphans by search
  const filteredOrphans = useMemo(() => {
    if (!search) return orphans;
    const searchLower = search.toLowerCase();
    return orphans.filter(
      (orphan: { applicant_name?: string; university?: string; applicant_phone?: string; [key: string]: unknown }) =>
        orphan.applicant_name?.toLowerCase().includes(searchLower) ||
        orphan.university?.toLowerCase().includes(searchLower) ||
        orphan.applicant_phone?.includes(search)
    );
  }, [orphans, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = orphans.length;
    const active = orphans.filter((o: { status?: string; [key: string]: unknown }) => o.status === 'approved').length;
    const pending = orphans.filter(
      (o: { status?: string; [key: string]: unknown }) => o.status === 'under_review' || o.status === 'submitted'
    ).length;
    const totalSupport = orphans.reduce((sum: number, o: { status?: string; [key: string]: unknown }) => {
      // We would need to get payments for each to calculate real total
      // For now just count approved ones
      return sum + (o.status === 'approved' ? 1 : 0);
    }, 0);

    return { total, active, pending, totalSupport };
  }, [orphans]);

  const handleViewDetails = (orphan: { _id?: string; $id?: string; [key: string]: unknown }) => {
    setSelectedOrphan({ ...orphan, _id: orphan._id || orphan.$id || '' } as typeof selectedOrphan);
    setIsDetailDialogOpen(true);
  };

  // Calculate total paid for an orphan
  const getTotalPaid = (applicationId: string) => {
    const orphanPayments = payments.filter(
      (p: { application_id?: string; status?: string; [key: string]: unknown }) => p.application_id === applicationId && p.status === 'paid'
    );
    return orphanPayments.reduce((sum: number, p: { amount?: number; [key: string]: unknown }) => sum + (p.amount || 0), 0);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500" />
          Yetim Öğrenciler
        </h1>
        <p className="text-slate-600 mt-1">Yetim öğrencilere sağlanan destekleri takip edin</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Toplam Yetim Öğrenci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aktif Destek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Destek Alan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSupport}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Ad, telefon veya üniversite ara..."
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
                <SelectItem value="submitted">Başvuru Yapıldı</SelectItem>
                <SelectItem value="under_review">İncelemede</SelectItem>
                <SelectItem value="approved">Aktif Destek</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
                <SelectItem value="waitlisted">Beklemede</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orphans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yetim Öğrenciler Listesi ({filteredOrphans.length})</CardTitle>
          <CardDescription>Yetim statüsündeki öğrencilerin burs bilgileri</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredOrphans.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Yetim öğrenci kaydı bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Öğrenci Bilgileri</TableHead>
                  <TableHead>Eğitim</TableHead>
                  <TableHead>Aile Durumu</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Başvuru Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrphans.map((orphan: { status?: string; _id?: string; $id?: string; [key: string]: unknown }) => {
                  const statusInfo = STATUS_LABELS[orphan.status as keyof typeof STATUS_LABELS];
                  const orphanId = orphan._id || orphan.$id || '';
                  const applicantEmail = typeof orphan.applicant_email === 'string' ? orphan.applicant_email : null;
                  const gradeLevel = typeof orphan.grade_level === 'string' ? orphan.grade_level : null;
                  const hasDisability = Boolean(orphan.has_disability);

                  return (
                    <TableRow key={orphanId}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            {String(orphan.applicant_name || '-')}
                          </div>
                          <div className="text-sm text-slate-500">{typeof orphan.applicant_phone === 'string' ? orphan.applicant_phone : '-'}</div>
                          {applicantEmail && (
                            <div className="text-xs text-slate-400">{applicantEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{typeof orphan.university === 'string' ? orphan.university : '-'}</div>
                          <div className="text-xs text-slate-500">{typeof orphan.department === 'string' ? orphan.department : '-'}</div>
                          {gradeLevel && (
                            <div className="text-xs text-slate-400">
                              {gradeLevel}. Sınıf
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Kardeş: {typeof orphan.sibling_count === 'number' ? orphan.sibling_count : 0}</div>
                          {hasDisability && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Engelli
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {orphan.gpa && typeof orphan.gpa === 'number' ? (
                          <span className="font-medium">{orphan.gpa.toFixed(2)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {orphan.submitted_at && typeof orphan.submitted_at === 'string'
                            ? new Date(orphan.submitted_at).toLocaleDateString('tr-TR')
                            : orphan.created_at && typeof orphan.created_at === 'string'
                              ? new Date(orphan.created_at).toLocaleDateString('tr-TR')
                              : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(orphan)}>
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
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              {selectedOrphan?.applicant_name}
            </DialogTitle>
            <DialogDescription>Yetim öğrenci detay bilgileri</DialogDescription>
          </DialogHeader>

          {selectedOrphan && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    STATUS_LABELS[selectedOrphan.status as keyof typeof STATUS_LABELS].color
                  }
                >
                  {STATUS_LABELS[selectedOrphan.status as keyof typeof STATUS_LABELS].label}
                </Badge>
                {selectedOrphan.priority_score && (
                  <Badge variant="outline">Öncelik Puanı: {selectedOrphan.priority_score}</Badge>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3">İletişim Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Telefon:</span>
                    <p className="font-medium">{selectedOrphan.applicant_phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">E-posta:</span>
                    <p className="font-medium">{selectedOrphan.applicant_email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Education Info */}
              <div>
                <h3 className="font-semibold mb-3">Eğitim Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Üniversite:</span>
                    <p className="font-medium">{selectedOrphan.university || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Bölüm:</span>
                    <p className="font-medium">{selectedOrphan.department || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Sınıf:</span>
                    <p className="font-medium">{selectedOrphan.grade_level || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">GPA:</span>
                    <p className="font-medium">
                      {selectedOrphan.gpa ? selectedOrphan.gpa.toFixed(2) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Akademik Yıl:</span>
                    <p className="font-medium">{selectedOrphan.academic_year || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Family Info */}
              <div>
                <h3 className="font-semibold mb-3">Aile Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Anne Mesleği:</span>
                    <p className="font-medium">{selectedOrphan.mother_occupation || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Baba Mesleği:</span>
                    <p className="font-medium">{selectedOrphan.father_occupation || 'Vefat'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Kardeş Sayısı:</span>
                    <p className="font-medium">{selectedOrphan.sibling_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Engel Durumu:</span>
                    <p className="font-medium">{selectedOrphan.has_disability ? 'Var' : 'Yok'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h3 className="font-semibold mb-3">Ekonomik Durum</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Aylık Gelir:</span>
                    <p className="font-medium">
                      {selectedOrphan.monthly_income
                        ? `₺${selectedOrphan.monthly_income.toLocaleString('tr-TR')}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Aile Geliri:</span>
                    <p className="font-medium">
                      {selectedOrphan.family_income
                        ? `₺${selectedOrphan.family_income.toLocaleString('tr-TR')}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payments */}
              {selectedOrphan.status === 'approved' && payments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Ödeme Geçmişi</h3>
                  <div className="space-y-2">
                    {payments.map((payment: { _id?: string; $id?: string; amount?: number; payment_date?: string; status?: string; [key: string]: unknown }) => {
                      const paymentId = payment._id || payment.$id || '';
                      const amount = payment.amount || 0;
                      const paymentDate = payment.payment_date && typeof payment.payment_date === 'string' ? payment.payment_date : '';
                      return (
                      <div
                        key={paymentId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"
                      >
                        <div>
                          <div className="font-medium">
                            ₺{amount.toLocaleString('tr-TR')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {paymentDate ? new Date(paymentDate).toLocaleDateString('tr-TR') : '-'}
                          </div>
                        </div>
                        <Badge
                          className={
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {payment.status === 'paid' ? 'Ödendi' : 'Beklemede'}
                        </Badge>
                      </div>
                    );
                    })}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Toplam Ödeme:</span>
                        <span>₺{getTotalPaid(selectedOrphan._id || selectedOrphan.$id || '').toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Essay/Motivation */}
              {selectedOrphan.essay && (
                <div>
                  <h3 className="font-semibold mb-3">Motivasyon Mektubu</h3>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedOrphan.essay}
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
