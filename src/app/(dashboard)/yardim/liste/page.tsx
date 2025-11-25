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
// Table component not used - using custom card layout instead
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
import logger from '@/lib/logger';
import {
  Search,
  Filter,
  Package,
  DollarSign,
  Utensils,
  Stethoscope,
  Users,
  Calendar,
  FileText,
  Download,
  FileDown,
} from 'lucide-react';
import { generateAidListPDF } from '@/lib/utils/pdf-export';
import { apiClient as api } from '@/lib/api/api-client';
import type { AidApplicationDocument } from '@/types/database';

interface AidRecord extends AidApplicationDocument {
  _id: string;
}

const STAGE_LABELS = {
  draft: { label: 'Taslak', color: 'bg-muted text-muted-foreground' },
  under_review: {
    label: 'İnceleme',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  approved: {
    label: 'Onaylandı',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  ongoing: {
    label: 'Devam Ediyor',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  completed: {
    label: 'Tamamlandı',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  },
};

const STATUS_LABELS = {
  open: {
    label: 'Açık',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  closed: {
    label: 'Kapalı',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
};

interface AidStats {
  totalApplications: number;
  totalOneTimeAid: number;
  totalRegularFinancialAid: number;
  totalRegularFoodAid: number;
  totalInKindAid: number;
  totalServiceReferrals: number;
  completedApplications: number;
  ongoingApplications: number;
  pendingApplications: number;
}

export default function AidListPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const limit = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ['aid-list', page, search, stageFilter, statusFilter],
    queryFn: () =>
      api.aidApplications.getAidApplications({
        page,
        limit,
        search,
        filters: {
          stage: stageFilter === 'all' ? undefined : stageFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      }),
  });

  const applications: AidRecord[] = (data?.data as AidRecord[]) || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Calculate statistics
  const stats: AidStats = useMemo(() => {
    const allData = applications;

    return {
      totalApplications: total,
      totalOneTimeAid: allData.reduce((sum, app) => sum + (app.one_time_aid || 0), 0),
      totalRegularFinancialAid: allData.reduce(
        (sum, app) => sum + (app.regular_financial_aid || 0),
        0
      ),
      totalRegularFoodAid: allData.reduce((sum, app) => sum + (app.regular_food_aid || 0), 0),
      totalInKindAid: allData.reduce((sum, app) => sum + (app.in_kind_aid || 0), 0),
      totalServiceReferrals: allData.reduce((sum, app) => sum + (app.service_referral || 0), 0),
      completedApplications: allData.filter((app) => app.stage === 'completed').length,
      ongoingApplications: allData.filter((app) => app.stage === 'ongoing').length,
      pendingApplications: allData.filter(
        (app) => app.stage === 'under_review' || app.stage === 'draft'
      ).length,
    };
  }, [applications, total]);

  const handleExportExcel = () => {
    const csvContent = [
      ['Rapor Türü', 'Yardım Listesi'],
      ['Tarih', new Date().toLocaleDateString('tr-TR')],
      [''],
      ['BAŞVURU LİSTESİ'],
      [
        'Başvuru No',
        'Başvuran',
        'Tür',
        'Tek Seferlik (₺)',
        'Düzenli Finansal (₺)',
        'Düzenli Gıda (Paket)',
        'Ayni (Adet)',
        'Sevk',
        'Aşama',
        'Durum',
        'Tarih',
      ],
      ...applications.map((app) => [
        app._id,
        app.applicant_name,
        app.applicant_type,
        app.one_time_aid || 0,
        app.regular_financial_aid || 0,
        app.regular_food_aid || 0,
        app.in_kind_aid || 0,
        app.service_referral || 0,
        STAGE_LABELS[app.stage as keyof typeof STAGE_LABELS]?.label || app.stage,
        STATUS_LABELS[app.status as keyof typeof STATUS_LABELS]?.label || app.status,
        new Date(app.application_date).toLocaleDateString('tr-TR'),
      ]),
    ];

    const csv = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yardim-listesi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Yardım listesi Excel formatında indirildi');
  };

  const handleExportPDF = () => {
    try {
      generateAidListPDF(applications);
      toast.success('Yardım listesi PDF formatında indirildi');
    } catch (error) {
      logger.error('PDF export failed', { error });
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  const getTotalAidValue = (app: AidRecord): number => {
    return (app.one_time_aid || 0) + (app.regular_financial_aid || 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yardım Listesi</h1>
          <p className="text-muted-foreground mt-2">
            Yapılan yardımları görüntüleyin ve takip edin
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yardım Listesi</h1>
          <p className="text-muted-foreground mt-2">
            Yapılan yardımları görüntüleyin ve takip edin
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium">Veriler yüklenirken hata oluştu</p>
            <p className="text-sm text-muted-foreground mt-2">Lütfen daha sonra tekrar deneyin</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yardım Listesi</h1>
          <p className="text-muted-foreground mt-2">
            Yapılan yardımları görüntüleyin ve takip edin
          </p>
        </div>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Dışa Aktar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raporu Dışa Aktar</DialogTitle>
              <DialogDescription>Yardım listesini istediğiniz formatta indirin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={handleExportExcel}
                className="w-full justify-start"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel (CSV) Olarak İndir
              </Button>
              <Button onClick={handleExportPDF} className="w-full justify-start" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                PDF Olarak İndir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Başvuru</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı başvuru</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Nakdi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalOneTimeAid + stats.totalRegularFinancialAid).toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalOneTimeAid > 0 &&
                `${stats.totalOneTimeAid.toLocaleString('tr-TR')} ₺ tek seferlik`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gıda Yardımı</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegularFoodAid}</div>
            <p className="text-xs text-muted-foreground mt-1">paket yardım</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ayni Yardım</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInKindAid}</div>
            <p className="text-xs text-muted-foreground mt-1">adet yardım</p>
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
                placeholder="Kişi / Kurum / Partner"
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm Aşamalar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Aşamalar</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="under_review">İnceleme</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="open">Açık</SelectItem>
                <SelectItem value="closed">Kapalı</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Yardım Listesi</CardTitle>
          <CardDescription>Toplam {total} yardım kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg font-medium">Yardım kaydı bulunamadı</p>
              <p className="text-sm mt-2">
                {search ? 'Arama kriterlerinize uygun yardım yok' : 'Henüz yardım eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{app.applicant_name}</h3>
                        <Badge variant="outline">
                          {app.applicant_type === 'person'
                            ? 'Kişi'
                            : app.applicant_type === 'organization'
                              ? 'Kurum'
                              : 'Partner'}
                        </Badge>
                        <Badge
                          className={STAGE_LABELS[app.stage as keyof typeof STAGE_LABELS].color}
                        >
                          {STAGE_LABELS[app.stage as keyof typeof STAGE_LABELS].label}
                        </Badge>
                        <Badge
                          className={STATUS_LABELS[app.status as keyof typeof STATUS_LABELS].color}
                        >
                          {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS].label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(app.application_date).toLocaleDateString('tr-TR')}</span>
                      </div>

                      {/* Aid Types */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {app.one_time_aid && app.one_time_aid > 0 && (
                          <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            <DollarSign className="h-3 w-3" />
                            Tek Seferlik: {app.one_time_aid.toLocaleString('tr-TR')} ₺
                          </Badge>
                        )}
                        {app.regular_financial_aid && app.regular_financial_aid > 0 && (
                          <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <DollarSign className="h-3 w-3" />
                            Düzenli: {app.regular_financial_aid.toLocaleString('tr-TR')} ₺
                          </Badge>
                        )}
                        {app.regular_food_aid && app.regular_food_aid > 0 && (
                          <Badge className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                            <Utensils className="h-3 w-3" />
                            Gıda: {app.regular_food_aid} paket
                          </Badge>
                        )}
                        {app.in_kind_aid && app.in_kind_aid > 0 && (
                          <Badge className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                            <Package className="h-3 w-3" />
                            Ayni: {app.in_kind_aid} adet
                          </Badge>
                        )}
                        {app.service_referral && app.service_referral > 0 && (
                          <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <Stethoscope className="h-3 w-3" />
                            Sevk: {app.service_referral}
                          </Badge>
                        )}
                      </div>

                      {/* Total Value */}
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Toplam Değer: </span>
                        <span className="font-bold text-lg">
                          {getTotalAidValue(app).toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
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
