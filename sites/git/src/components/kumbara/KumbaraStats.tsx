'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, PiggyBank, MapPin, Calendar, DollarSign, Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KumbaraStats {
  total_kumbara: number;
  total_amount: number;
  active_locations: number;
  this_month_amount: number;
  pending_collections: number;
  completed_collections: number;
  monthly_growth: number;
}

export function KumbaraStats() {
  const { data, isLoading, error } = useQuery<KumbaraStats>({
    queryKey: ['kumbara-stats'],
    queryFn: async () => {
      const response = await fetch('/api/kumbara/stats');
      if (!response.ok) {
        throw new Error('İstatistikler yüklenemedi');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">İstatistikler yüklenirken hata oluştu</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Toplam Kumbara Sayısı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Kumbara</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data?.total_kumbara || 0)}</div>
          <p className="text-xs text-muted-foreground">Kayıtlı kumbara sayısı</p>
        </CardContent>
      </Card>

      {/* Toplam Tutar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data?.total_amount || 0)}</div>
          <p className="text-xs text-muted-foreground">Tüm kumbara bağışları</p>
        </CardContent>
      </Card>

      {/* Aktif Lokasyonlar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktif Lokasyonlar</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data?.active_locations || 0)}</div>
          <p className="text-xs text-muted-foreground">Başvuru alan konum</p>
        </CardContent>
      </Card>

      {/* Bu Ay Toplanan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Ay Toplanan</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data?.this_month_amount || 0)}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {data?.monthly_growth !== undefined && (
              <TrendingUp
                className={`h-3 w-3 ${
                  data.monthly_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              />
            )}
            {data?.monthly_growth !== undefined && (
              <span className={data.monthly_growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {data.monthly_growth >= 0 ? '+' : ''}
                {data.monthly_growth.toFixed(1)}%
              </span>
            )}
            geçen aya göre
          </p>
        </CardContent>
      </Card>

      {/* Bekleyen Koleksiyonlar */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Koleksiyon Durumu</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Beklemede</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatNumber(data?.pending_collections || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tamamlandı</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(data?.completed_collections || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
