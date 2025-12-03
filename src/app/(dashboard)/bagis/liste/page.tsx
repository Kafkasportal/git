'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { donations } from '@/lib/api/crud-factory';
import { VirtualizedDataTable, type DataTableColumn } from '@/components/ui/virtualized-data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, DollarSign, User, Calendar, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import type { BulkEditField } from '@/components/ui/bulk-edit-modal';
import { ExportMenu } from '@/components/ui/export-menu';
import { useFilters } from '@/hooks/useFilters';
import { FilterPanel, FilterField } from '@/components/ui/filter-panel';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import type { DonationDocument } from '@/types/database';

const DonationForm = dynamic(
  () => import('@/components/forms/DonationForm').then((mod) => ({ default: mod.DonationForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
    ssr: false,
  }
);

export default function DonationsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { filters, resetFilters, handleFiltersChange } = useFilters({
    syncWithUrl: true,
    presetsKey: 'donations-filters',
  });

  // Bulk operations
  const bulkOps = useBulkOperations({
    endpoint: '/api/donations',
    resourceName: 'bağış',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['donations', filters],
    queryFn: () =>
      donations.getAll({
        page: 1,
        limit: 50, // Optimized for better performance - use pagination
        search: filters.search as string,
      }),
  });

  const filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Arama',
      type: 'text',
      placeholder: 'Bağışçı adı veya açıklama ile ara...',
    },
    {
      key: 'status',
      label: 'Durum',
      type: 'select',
      options: [
        { label: 'Tamamlandı', value: 'completed' },
        { label: 'Beklemede', value: 'pending' },
        { label: 'İptal Edildi', value: 'cancelled' },
      ],
    },
  ];

  // Bulk edit fields
  const bulkEditFields: BulkEditField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Durum',
      type: 'select',
      options: [
        { label: 'Tamamlandı', value: 'completed' },
        { label: 'Beklemede', value: 'pending' },
        { label: 'İptal Edildi', value: 'cancelled' },
      ],
    },
    {
      key: 'payment_method',
      label: 'Ödeme Yöntemi',
      type: 'select',
      options: [
        { label: 'Nakit', value: 'cash' },
        { label: 'Kredi Kartı', value: 'credit_card' },
        { label: 'Banka Transferi', value: 'bank_transfer' },
        { label: 'Çek', value: 'check' },
      ],
    },
    {
      key: 'donation_type',
      label: 'Bağış Türü',
      type: 'select',
      options: [
        { label: 'Ayni', value: 'in_kind' },
        { label: 'Nakdi', value: 'monetary' },
      ],
    },
  ], []);

  // Status options for bulk status change
  const statusOptions = [
    { label: 'Tamamlandı', value: 'completed' },
    { label: 'Beklemede', value: 'pending' },
    { label: 'İptal Edildi', value: 'cancelled' },
  ];

  // Memoize donations list and total amount to prevent unnecessary recalculations
  const donationsList = useMemo(() => {
    return ((data?.data ?? []) as DonationDocument[]);
  }, [data?.data]);

  const totalAmount = useMemo(() => {
    return donationsList.reduce((sum, d) => sum + d.amount, 0);
  }, [donationsList]);

  const columns: DataTableColumn<(typeof donationsList)[0]>[] = [
    {
      key: 'donor',
      label: 'Bağışçı',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{item.donor_name}</span>
          </div>
          {item.donor_email && (
            <p className="text-sm text-muted-foreground mt-1">{item.donor_email}</p>
          )}
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'amount',
      label: 'Tutar',
      render: (item) => (
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {item.amount.toLocaleString('tr-TR')} ₺
          </div>
          <p className="text-xs text-muted-foreground mt-1">{item.currency}</p>
        </div>
      ),
      className: 'w-[120px] text-right',
    },
    {
      key: 'payment_method',
      label: 'Ödeme Yöntemi',
      render: (item) => <span className="font-medium">{item.payment_method}</span>,
      className: 'min-w-[150px]',
    },
    {
      key: 'donation_type',
      label: 'Bağış Türü',
      render: (item) => <span className="font-medium">{item.donation_type}</span>,
      className: 'min-w-[150px]',
    },
    {
      key: 'purpose',
      label: 'Amaç',
      render: (item) => <span className="font-medium">{item.donation_purpose}</span>,
      className: 'min-w-[150px]',
    },
    {
      key: 'date',
      label: 'Tarih',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {item._creationTime
              ? new Date(item._creationTime).toLocaleDateString('tr-TR')
              : item.$createdAt
                ? new Date(item.$createdAt).toLocaleDateString('tr-TR')
                : '-'}
          </span>
        </div>
      ),
      className: 'min-w-[130px]',
    },
    {
      key: 'receipt',
      label: 'Fiş No',
      render: (item) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{item.receipt_number}</span>
        </div>
      ),
      className: 'min-w-[120px]',
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
            item.status === 'completed'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}
        >
          {item.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
        </span>
      ),
      className: 'w-[100px]',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bağışlar</h1>
          <p className="text-muted-foreground mt-2">Bağış kayıtlarını görüntüleyin ve yönetin</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu data={donationsList} filename="bagislar" title="Bağış Listesi" />
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="gap-2 sm:w-auto w-full">
                <Plus className="h-4 w-4" />
                Yeni Bağış
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogTitle>Yeni Bağış Ekle</DialogTitle>
              <DialogDescription>Bağış bilgilerini girerek yeni kayıt oluşturun</DialogDescription>
              <DonationForm
                onSuccess={() => {
                  setShowCreateForm(false);
                }}
                onCancel={() => {
                  setShowCreateForm(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || donationsList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString('tr-TR')} ₺</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Sayfadaki Tutar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donationsList.reduce((sum, d) => sum + d.amount, 0).toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkOps.selectedCount}
        onClearSelection={bulkOps.clearSelection}
        onDelete={async () => {
          await bulkOps.bulkDelete();
        }}
        onBulkEdit={async (values) => {
          await bulkOps.bulkUpdate(values);
        }}
        onStatusChange={bulkOps.bulkStatusChange}
        onExport={async (format) => {
          const blob = await bulkOps.bulkExport(format);
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bagislar-secili.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        }}
        statusOptions={statusOptions}
        editFields={bulkEditFields}
        isLoading={bulkOps.isLoading}
        resourceName="bağış"
      />

      {/* Search */}
      <FilterPanel
        fields={filterFields}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
      />

      {/* List */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle>Bağış Listesi</CardTitle>
          <CardDescription>Toplam {data?.total || donationsList.length} bağış kaydı</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <VirtualizedDataTable
            data={donationsList}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Bağış kaydı bulunamadı"
            emptyDescription="Henüz bağış eklenmemiş"
            rowHeight={70}
            containerHeight={700}
            selectable={true}
            selectedItems={bulkOps.selectedIds}
            onSelectionChange={(ids) => {
              // Sync with bulk ops
              bulkOps.clearSelection();
              ids.forEach((id) => bulkOps.toggleSelection(id));
            }}
            getItemId={(item) => item._id || item.$id || ''}
          />
        </CardContent>
      </Card>
    </div>
  );
}
