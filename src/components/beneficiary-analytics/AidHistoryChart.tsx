'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { apiClient as api } from '@/lib/api/api-client';

interface AidHistoryChartProps {
  beneficiaryId: string;
}

export function AidHistoryChart({ beneficiaryId }: AidHistoryChartProps) {
  const { data: aidHistory, isLoading } = useQuery({
    queryKey: ['beneficiary-aid-history', beneficiaryId],
    queryFn: () => api.beneficiaries.getAidHistory?.(beneficiaryId) || [],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Yardım Geçmişi Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAid =
    aidHistory?.reduce((sum: number, aid: { amount?: number }) => sum + (aid.amount || 0), 0) || 0;
  const averageAid = aidHistory && aidHistory.length > 0 ? totalAid / aidHistory.length : 0;
  const lastAid = aidHistory?.[0] as { amount?: number } | undefined;
  const previousAid = aidHistory?.[1] as { amount?: number } | undefined;

  const trend =
    lastAid?.amount && previousAid?.amount
      ? ((lastAid.amount - previousAid.amount) / previousAid.amount) * 100
      : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Yardım</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalAid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yardım Sayısı</p>
                <p className="text-xl font-bold text-blue-600">{aidHistory?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ortalama</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(averageAid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${trend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {trend >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <p
                  className={`text-xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {trend >= 0 ? '+' : ''}
                  {trend.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Aid History */}
      <Card>
        <CardHeader>
          <CardTitle>Son Yardımlar</CardTitle>
        </CardHeader>
        <CardContent>
          {aidHistory && Array.isArray(aidHistory) && aidHistory.length > 0 ? (
            <div className="space-y-3">
              {aidHistory.slice(0, 5).map(
                (
                  aid: {
                    id?: string;
                    type?: string;
                    date?: string;
                    amount?: number;
                    status?: string;
                  },
                  index: number
                ) => (
                  <div
                    key={aid.id || index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{aid.type || 'Yardım'}</p>
                        <p className="text-sm text-muted-foreground">
                          {aid.date ? new Date(aid.date).toLocaleDateString('tr-TR') : 'Tarih yok'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(aid.amount || 0)}
                      </p>
                      {aid.status && (
                        <Badge variant="secondary" className="text-xs">
                          {aid.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Henüz yardım geçmişi yok
              </h3>
              <p className="text-sm text-muted-foreground">
                Bu ihtiyaç sahibine henüz yardım yapılmamış.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
