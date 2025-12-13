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
import { ArrowUpRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import { ExportMenu } from '@/components/ui/export-menu';
import { useFilters } from '@/hooks/useFilters';
import { FilterPanel, FilterField } from '@/components/ui/filter-panel';

// Performance monitoring imports
import { useFPSMonitor } from '@/lib/performance-monitor';
import { useCachedQuery, usePrefetchWithCache } from '@/lib/api-cache';
import { useDebouncedValue } from '@/lib/performance/hooks';

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
    logger.error('Direct API call failed', error);
    throw error;
  }
}

// Import export functions
// import {
//   exportToPDF,
//   exportToExcel,
//   exportToCSV,
//   type ExportColumn,
//   maskTCNo,
//   formatDate,
// } from '@/lib/export/export-service';

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
  const queryClient = useQueryClient();

  const { filters, resetFilters, handleFiltersChange } = useFilters({
    syncWithUrl: true,
    presetsKey: 'beneficiaries-filters',
  });

  // Debounce search to reduce API calls (300ms delay)
  const debouncedSearch = useDebouncedValue(filters.search as string, 300);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Arama',
      type: 'text',
      placeholder: 'İsim, TC No veya Telefon ile ara...',
    },
  ];

  // Use cached query with performance optimization
  // Reduced limit for better performance - use pagination instead of loading all data
  const {
    data: cachedData,
    isLoading,
    error,
    refetch,
  } = useCachedQuery<{ success: boolean; data: BeneficiaryDocument[]; total: number }>({
    queryKey: ['beneficiaries-cached', debouncedSearch],
    endpoint: '/api/beneficiaries',
    params: {
      page: 1,
      limit: 50, // Optimized for better performance - use pagination
      search: debouncedSearch,
    },
    dataType: 'beneficiaries',
    staleTime: 10 * 60 * 1000, // 10 minutes - increased for better caching
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fallback to direct API if cached query fails
  const fallbackQuery = useQuery({
    queryKey: ['beneficiaries', debouncedSearch],
    queryFn: () =>
      fetchBeneficiariesDirectly({
        page: 1,
        limit: 50, // Optimized for better performance
        search: debouncedSearch,
      }),
    enabled: !cachedData && !isLoading,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const beneficiaries = (cachedData?.data ||
    fallbackQuery.data?.data ||
    []) as BeneficiaryDocument[];

  // Memoize table data to prevent unnecessary recalculations
  const tableData = useMemo(() => {
    return beneficiaries.map((item: BeneficiaryDocument, index: number) => ({
      ...item,
      rowIndex: index + 1,
    }));
  }, [beneficiaries]);

  // Memoized handlers
  const handleModalClose = useCallback(() => {
    setShowQuickAddModal(false);
    refetch();
    fallbackQuery.refetch();
  }, [refetch, fallbackQuery]);

  const handleShowModal = useCallback(() => {
    setShowQuickAddModal(true);
  }, []);

  // Bulk operations mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/beneficiaries/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Silme işlemi başarısız');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(`${selectedItems.size} kayıt başarıyla silindi`);
      setSelectedItems(new Set());
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries-cached'] });
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      refetch();
      fallbackQuery.refetch();
    },
    onError: () => {
      toast.error('Kayıtlar silinirken bir hata oluştu');
    },
  });

  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const response = await fetch('/api/beneficiaries/bulk-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Durum güncelleme işlemi başarısız');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      const statusLabel = variables.status === 'AKTIF' ? 'Aktif' : 'Pasif';
      toast.success(`${selectedItems.size} kayıt ${statusLabel} olarak güncellendi`);
      setSelectedItems(new Set());
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries-cached'] });
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      refetch();
      fallbackQuery.refetch();
    },
    onError: () => {
      toast.error('Durum güncellenirken bir hata oluştu');
    },
  });

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedItems);
    bulkDeleteMutation.mutate(ids);
  }, [selectedItems, bulkDeleteMutation]);

  const handleBulkStatusChange = useCallback((status: string) => {
    const ids = Array.from(selectedItems);
    bulkStatusUpdateMutation.mutate({ ids, status });
  }, [selectedItems, bulkStatusUpdateMutation]);

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
          const type = (item as { beneficiary_type?: string }).beneficiary_type;
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
          <ExportMenu
            data={beneficiaries}
            filename="ihtiyac-sahipleri"
            title="İhtiyaç Sahipleri Listesi"
          />
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

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedItems.size}
        onClearSelection={() => setSelectedItems(new Set())}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        statusOptions={[
          { value: 'AKTIF', label: 'Aktif Yap' },
          { value: 'PASIF', label: 'Pasif Yap' },
        ]}
        isLoading={bulkDeleteMutation.isPending || bulkStatusUpdateMutation.isPending}
      />

      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İhtiyaç Sahipleri Listesi</CardTitle>
              <CardDescription>Toplam {beneficiaries.length} kayıt</CardDescription>
            </div>
            <FilterPanel
              fields={filterFields}
              onFiltersChange={handleFiltersChange}
              onReset={resetFilters}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <VirtualizedDataTable<BeneficiaryDocument & { rowIndex: number }>
            data={tableData}
            columns={columns}
            isLoading={isLoading || fallbackQuery.isLoading}
            error={(error || fallbackQuery.error) as Error}
            emptyMessage="İhtiyaç sahibi bulunamadı"
            emptyDescription="Henüz kayıt eklenmemiş"
            searchable={false}
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
            selectable={true}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            getItemId={(item) => item._id || ''}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
