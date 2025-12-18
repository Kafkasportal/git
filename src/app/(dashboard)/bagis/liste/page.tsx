'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { donations } from '@/lib/api/crud-factory';
import { VirtualizedDataTable, type DataTableColumn } from '@/components/ui/virtualized-data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, TrendingUp, Users, Banknote, Calendar, FileText, User, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import type { BulkEditField } from '@/components/ui/bulk-edit-modal';
import { ExportMenu } from '@/components/ui/export-menu';
import { useFilters } from '@/hooks/useFilters';
import { FilterPanel, FilterField } from '@/components/ui/filter-panel';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import type { DonationDocument } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';

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

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { label: 'Tamamlandı', icon: CheckCircle2, badgeStatus: 'active' as const },
    pending: { label: 'Beklemede', icon: Clock, badgeStatus: 'pending' as const },
    cancelled: { label: 'İptal', icon: FileText, badgeStatus: 'error' as const },
  }[status] || { label: status, icon: FileText, badgeStatus: undefined };

  const Icon = config.icon;

  return (
    <Badge status={config.badgeStatus} variant={config.badgeStatus ? undefined : 'outline'}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function DonationsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { filters, resetFilters, handleFiltersChange } = useFilters({
    syncWithUrl: true,
    presetsKey: 'donations-filters',
  });

  const bulkOps = useBulkOperations({
    endpoint: '/api/donations',
    resourceName: 'bağış',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] }).catch(() => {
        // Ignore errors from query invalidation
      });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['donations', filters],
    queryFn: () =>
      donations.getAll({
        page: 1,
        limit: 50,
        search: filters.search as string,
      }),
  });

  const filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Arama',
      type: 'text',
      placeholder: 'Bağışçı adı veya açıklama...',
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
  ], []);

  const statusOptions = [
    { label: 'Tamamlandı', value: 'completed' },
    { label: 'Beklemede', value: 'pending' },
    { label: 'İptal Edildi', value: 'cancelled' },
  ];

  const donationsList = useMemo(() => ((data?.data ?? []) as DonationDocument[]), [data?.data]);
  const totalAmount = useMemo(() => donationsList.reduce((sum, d) => sum + d.amount, 0), [donationsList]);
  const completedCount = useMemo(() => donationsList.filter(d => d.status === 'completed').length, [donationsList]);

  const columns: DataTableColumn<(typeof donationsList)[0]>[] = [
    {
      key: 'donor',
      label: 'Bağışçı',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{item.donor_name}</p>
            {item.donor_email && (
              <p className="text-xs text-muted-foreground">{item.donor_email}</p>
            )}
          </div>
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      key: 'amount',
      label: 'Tutar',
      render: (item) => (
        <div className="text-right">
          <p className="text-lg font-semibold text-success">
            {item.amount.toLocaleString('tr-TR')} ₺
          </p>
        </div>
      ),
      className: 'w-[130px] text-right',
    },
    {
      key: 'payment_method',
      label: 'Ödeme',
      render: (item) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{item.payment_method}</span>
        </div>
      ),
      className: 'min-w-[130px]',
    },
    {
      key: 'purpose',
      label: 'Amaç',
      render: (item) => (
        <span className="text-sm text-muted-foreground">{item.donation_purpose || '-'}</span>
      ),
      className: 'min-w-[140px]',
    },
    {
      key: 'date',
      label: 'Tarih',
      render: (item) => {
        let dateString = '-';
        if (item._creationTime) {
          dateString = new Date(item._creationTime).toLocaleDateString('tr-TR');
        } else if (item.$createdAt) {
          dateString = new Date(item.$createdAt).toLocaleDateString('tr-TR');
        }
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{dateString}</span>
          </div>
        );
      },
      className: 'min-w-[120px]',
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} />,
      className: 'w-[130px]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bağış Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Bağış kayıtlarını görüntüleyin ve yönetin</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu data={donationsList} filename="bagislar" title="Bağış Listesi" />
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Bağış
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Bağış Ekle</DialogTitle>
                <DialogDescription>Bağış bilgilerini girerek yeni kayıt oluşturun</DialogDescription>
              </DialogHeader>
              <DonationForm
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 grid-cols-4">
        <StatCard
          title="Toplam Bağış"
          value={data?.total || donationsList.length}
          description="Tüm zamanlar"
          icon={Users}
          colorTheme="neutral"
        />
        <StatCard
          title="Toplam Tutar"
          value={`${totalAmount.toLocaleString('tr-TR')} ₺`}
          description="Toplanan miktar"
          icon={Banknote}
          colorTheme="success"
          change={{ value: '+12%', type: 'positive' }}
        />
        <StatCard
          title="Tamamlanan"
          value={completedCount}
          description={`${donationsList.length > 0 ? Math.round((completedCount / donationsList.length) * 100) : 0}% başarı oranı`}
          icon={CheckCircle2}
          colorTheme="success"
        />
        <StatCard
          title="Bu Ay"
          value={donationsList.filter(d => {
            const date = new Date(d._creationTime || d.$createdAt || 0);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}
          description="Yeni bağış"
          icon={Calendar}
          colorTheme="info"
        />
      </div>

      {/* Bulk Actions */}
      <BulkActionsToolbar
        selectedCount={bulkOps.selectedCount}
        onClearSelection={bulkOps.clearSelection}
        onDelete={async () => { await bulkOps.bulkDelete(); }}
        onBulkEdit={async (values) => { await bulkOps.bulkUpdate(values); }}
        onStatusChange={bulkOps.bulkStatusChange}
        onExport={async (format) => {
          const blob = await bulkOps.bulkExport(format);
          if (blob) {
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bagislar-secili.${format}`;
            document.body.appendChild(a);
            a.click();
            globalThis.URL.revokeObjectURL(url);
            a.remove();
          }
        }}
        statusOptions={statusOptions}
        editFields={bulkEditFields}
        isLoading={bulkOps.isLoading}
        resourceName="bağış"
      />

      {/* Filters */}
      <FilterPanel
        fields={filterFields}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
      />

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bağış Listesi</CardTitle>
              <CardDescription>Toplam {data?.total || donationsList.length} kayıt</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VirtualizedDataTable
            data={donationsList}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Bağış kaydı bulunamadı"
            emptyDescription="Henüz bağış eklenmemiş"
            rowHeight={72}
            containerHeight={600}
            selectable={true}
            selectedItems={bulkOps.selectedIds}
            onSelectionChange={(ids) => {
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
