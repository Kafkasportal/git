'use client';

import React, { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VirtualizedDataTable, type DataTableColumn } from '@/components/ui/virtualized-data-table';
import { PageLayout } from '@/components/layouts/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { BeneficiaryDocument } from '@/types/database';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { ArrowUpRight, Download, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Performance monitoring imports
import { useFPSMonitor } from '@/lib/performance-monitor';
import { useCachedQuery, usePrefetchWithCache } from '@/lib/api-cache';

// Unified skeleton with all features
import { TableSkeleton } from '@/components/ui/skeleton';

// Completely independent API function to bypass HMR issues
async function fetchBeneficiariesDirectly(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/beneficiaries${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Direct API call failed', { error });
    throw error;
  }
}

// Stub function for beneficiary export
const exportBeneficiaries = async (_params: {
  search?: string;
  beneficiaries?: BeneficiaryDocument[];
  format?: 'csv' | 'excel' | 'pdf';
}) => {
  toast.info('Dışa aktarma özelliği yakında eklenecek');
  return Promise.resolve({ success: true, data: null, error: null });
};

// Lazy load heavy modal component
const BeneficiaryQuickAddModal = lazy(() =>
  import('@/components/forms/BeneficiaryQuickAddModal').then((mod) => ({
    default: mod.BeneficiaryQuickAddModal,
  }))
);

export default function BeneficiariesPage() {
  // Performance monitoring
  const { getFPS, isGoodPerformance } = useFPSMonitor();

  // Smart caching
  const { prefetch } = usePrefetchWithCache();

  const router = useRouter();

  const [search, setSearch] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Use cached query with performance optimization
  const {
    data: cachedData,
    isLoading,
    error,
    refetch,
  } = useCachedQuery<{ success: boolean; data: BeneficiaryDocument[]; total: number }>({
    queryKey: ['beneficiaries-cached', search],
    endpoint: '/api/beneficiaries',
    params: {
      page: 1,
      limit: 10000, // Load all data for virtual scrolling
      search,
    },
    dataType: 'beneficiaries',
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });

  // Fallback to direct API if cached query fails
  const fallbackQuery = useQuery({
    queryKey: ['beneficiaries', search],
    queryFn: () =>
      fetchBeneficiariesDirectly({
        page: 1,
        limit: 10000,
        search,
      }),
    enabled: !cachedData && !isLoading,
  });

  const beneficiaries = (cachedData?.data ||
    fallbackQuery.data?.data ||
    []) as BeneficiaryDocument[];

  // Tablo için 1'den başlayan satır numarası ekle
  const tableData = beneficiaries.map((item, index) => ({
    ...item,
    rowIndex: index + 1,
  }));

  // Memoized handlers
  const handleModalClose = useCallback(() => {
    setShowQuickAddModal(false);
    refetch();
    fallbackQuery.refetch();
  }, [refetch, fallbackQuery]);

  const handleExport = useCallback(async () => {
    const result = await exportBeneficiaries({ search, beneficiaries });
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ihtiyac_sahipleri_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Veri başarıyla dışa aktarıldı');
    } else {
      toast.error('Dışa aktarma sırasında hata oluştu');
    }
  }, [search, beneficiaries]);

  const handleShowModal = useCallback(() => {
    setShowQuickAddModal(true);
  }, []);

  // Performance monitoring
  React.useEffect(() => {
    if (!isGoodPerformance() && process.env.NODE_ENV === 'development') {
      logger.warn('Performance degraded', { fps: getFPS() });
    }
  }, [getFPS, isGoodPerformance]);

  // Prefetch related data
  React.useEffect(() => {
    prefetch({
      endpoint: '/api/aid-applications',
      dataType: 'applications',
      priority: 'normal',
    });
  }, [prefetch]);

  // Memoized columns
  const columns: DataTableColumn<BeneficiaryDocument & { rowIndex: number }>[] = useMemo(
    () => [
      {
        key: 'rowIndex',
        label: 'ID',
        className:
          'flex-none w-[60px] max-w-[60px] text-xs overflow-hidden text-center text-muted-foreground',
        render: (item) => <span>{item.rowIndex}</span>,
      },
      {
        key: 'actions',
        label: '',
        render: (item) => (
          <Link href={`/yardim/ihtiyac-sahipleri/${item._id}`}>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        ),
        className: 'w-12',
      },
      {
        key: 'type',
        label: 'Tür',
        className: 'flex-none w-[140px] max-w-[140px] text-xs overflow-hidden',
        render: (item) => {
          const type = (item as any).beneficiary_type;
          return (
            <Badge variant="secondary" className="font-medium">
              {!type || type === 'primary_person'
                ? 'İhtiyaç Sahibi Kişi'
                : 'Bakmakla Yükümlü Olunan Kişi'}
            </Badge>
          );
        },
      },
      {
        key: 'name',
        label: 'İsim',
        className: 'flex-none w-[200px] max-w-[200px] text-sm overflow-hidden',
        render: (item) => (
          <span
            className="font-medium text-foreground block truncate overflow-hidden text-ellipsis"
            title={item.name || '-'}
          >
            {(item.name || '-').replace(/\s+/g, ' ')}
          </span>
        ),
      },
      {
        key: 'category',
        label: 'Kategori',
        className: 'flex-none w-[140px] max-w-[140px] text-xs overflow-hidden',
        render: (item) => (
          <Badge variant="outline" className="text-xs">
            {item.status === 'AKTIF'
              ? 'Aktif'
              : item.status === 'PASIF'
                ? 'Pasif'
                : item.status || '-'}
          </Badge>
        ),
      },
      {
        key: 'age',
        label: 'Yaş',
        className: 'flex-none w-[60px] max-w-[60px] text-xs overflow-hidden text-center',
        render: (item) => {
          if (!item.birth_date) return <span>-</span>;
          try {
            const birthDate = new Date(item.birth_date);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const calculatedAge =
              monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ? age - 1
                : age;
            return <span>{calculatedAge > 0 ? calculatedAge : '-'}</span>;
          } catch {
            return <span>-</span>;
          }
        },
      },
      {
        key: 'nationality',
        label: 'Uyruk',
        className: 'flex-none w-[80px] max-w-[80px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate" title={item.nationality || '-'}>
            {item.nationality || '-'}
          </span>
        ),
      },
      {
        key: 'tc_no',
        label: 'Kimlik No',
        className: 'flex-none w-[120px] max-w-[120px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate" title={item.tc_no || '-'}>
            {item.tc_no || '-'}
          </span>
        ),
      },
      {
        key: 'phone',
        label: 'Cep Telefonu',
        className: 'flex-none w-[150px] max-w-[150px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate overflow-hidden text-ellipsis" title={item.phone || '-'}>
            {item.phone || '-'}
          </span>
        ),
      },
      {
        key: 'country',
        label: 'Ülke',
        className: 'flex-none w-[100px] max-w-[100px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate" title={item.nationality || '-'}>
            {item.nationality || '-'}
          </span>
        ),
      },
      {
        key: 'city',
        label: 'Şehir',
        className: 'flex-none w-[120px] max-w-[120px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate" title={item.city || '-'}>
            {item.city || '-'}
          </span>
        ),
      },
      {
        key: 'settlement',
        label: 'Yerleşim',
        className: 'flex-none w-[120px] max-w-[120px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate" title={item.district || item.neighborhood || '-'}>
            {item.district || item.neighborhood || '-'}
          </span>
        ),
      },
      {
        key: 'address',
        label: 'Adres',
        className: 'flex-1 min-w-[200px] text-xs overflow-hidden',
        render: (item) => (
          <span
            className="block truncate overflow-hidden text-ellipsis whitespace-nowrap"
            title={item.address || '-'}
          >
            {item.address || '-'}
          </span>
        ),
      },
      {
        key: 'person',
        label: 'Kişi',
        className: 'flex-none w-[80px] max-w-[80px] text-xs overflow-hidden text-center',
        render: (item) => <span className="font-medium">{item.family_size ?? '-'}</span>,
      },
      {
        key: 'orphan',
        label: 'Yetim',
        className: 'flex-none w-[80px] max-w-[80px] text-xs overflow-hidden text-center',
        render: (item) => <span>{item.orphan_children_count ?? 0}</span>,
      },
      {
        key: 'application',
        label: 'Başvuru',
        className: 'flex-none w-[100px] max-w-[100px] text-xs overflow-hidden',
        render: (item) => (
          <Badge variant="outline" className="text-xs">
            {item.aid_type || item.application_source || '-'}
          </Badge>
        ),
      },
      {
        key: 'aid',
        label: 'Yardım',
        className: 'flex-none w-[100px] max-w-[100px] text-xs overflow-hidden text-right',
        render: (item) => (
          <span className="font-medium text-green-600">
            {item.totalAidAmount ? `${item.totalAidAmount.toLocaleString('tr-TR')} ₺` : '-'}
          </span>
        ),
      },
      {
        key: 'file_number',
        label: 'Dosya No',
        className: 'flex-none w-[120px] max-w-[120px] text-xs overflow-hidden',
        render: (item) => (
          <span className="block truncate" title={item._id || '-'}>
            {item._id?.slice(-8) || '-'}
          </span>
        ),
      },
      {
        key: 'last_assignment',
        label: 'Son Atama',
        className: 'flex-none w-[120px] max-w-[120px] text-xs overflow-hidden',
        render: (item) => {
          if (!item.approved_at) return <span>-</span>;
          try {
            const date = new Date(item.approved_at);
            return <span>{date.toLocaleDateString('tr-TR')}</span>;
          } catch {
            return <span>-</span>;
          }
        },
      },
    ],
    []
  );

  return (
    <PageLayout
      title="İhtiyaç Sahipleri"
      description="Kayıtları yönetin"
      className="space-y-4 sm:space-y-6 w-full"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button size="sm" onClick={handleShowModal} className="gap-1">
            <Plus className="h-4 w-4" />
            Yeni Ekle
          </Button>
        </>
      }
    >
      {showQuickAddModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-background rounded-lg shadow-lg border p-6 max-w-md w-full mx-4">
                <TableSkeleton rows={4} />
              </div>
            </div>
          }
        >
          <BeneficiaryQuickAddModal open={showQuickAddModal} onOpenChange={handleModalClose} />
        </Suspense>
      )}

      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle>İhtiyaç Sahipleri Listesi</CardTitle>
          <CardDescription>Toplam {beneficiaries.length} kayıt</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <VirtualizedDataTable<BeneficiaryDocument & { rowIndex: number }>
            data={tableData}
            columns={columns}
            isLoading={isLoading || fallbackQuery.isLoading}
            error={(error || fallbackQuery.error) as Error}
            emptyMessage="İhtiyaç sahibi bulunamadı"
            emptyDescription="Henüz kayıt eklenmemiş"
            searchable={true}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
            }}
            searchPlaceholder="İsim/TC/Telefon ara..."
            refetch={() => {
              refetch();
              fallbackQuery.refetch();
            }}
            rowHeight={64}
            containerHeight={800}
            onRowClick={(item) => {
              // Tüm satıra tıklanınca da detay sayfasına git
              if (item._id) {
                router.push(`/yardim/ihtiyac-sahipleri/${item._id}`);
              }
            }}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
