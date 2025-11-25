'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { VirtualizedDataTable, type DataTableColumn } from '@/components/ui/virtualized-data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Plus, DollarSign, User, Calendar, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';

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
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['donations', search],
    queryFn: () =>
      api.donations.getDonations({
        page: 1,
        limit: 10000, // Load all data for virtual scrolling
        search,
      }),
  });

  const donations = data?.data || [];

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  const columns: DataTableColumn<(typeof donations)[0]>[] = [
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
            {item._creationTime ? new Date(item._creationTime).toLocaleDateString('tr-TR') : item.$createdAt ? new Date(item.$createdAt).toLocaleDateString('tr-TR') : '-'}
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

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || donations.length}</div>
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
              {donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle>Arama</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Bağışçı adı veya fiş numarası ile ara..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle>Bağış Listesi</CardTitle>
          <CardDescription>Toplam {data?.total || donations.length} bağış kaydı</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <VirtualizedDataTable
            data={donations}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Bağış kaydı bulunamadı"
            emptyDescription="Henüz bağış eklenmemiş"
            rowHeight={70}
            containerHeight={700}
          />
        </CardContent>
      </Card>
    </div>
  );
}
