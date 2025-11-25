'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CurrencyRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  change?: number;
}

export interface CurrencyWidgetProps {
  rates: CurrencyRate[];
  lastUpdate?: string;
  isLoading?: boolean;
}

export function CurrencyWidget({ rates, lastUpdate, isLoading }: CurrencyWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Döviz Kurları</CardTitle>
              <CardDescription className="mt-1">Anlık kur bilgileri</CardDescription>
            </div>
            <Coins className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Döviz Kurları</CardTitle>
            <CardDescription className="mt-1">
              {lastUpdate ? `Son güncelleme: ${lastUpdate}` : 'Anlık kur bilgileri'}
            </CardDescription>
          </div>
          <Coins className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rates.map((rate) => (
            <div
              key={rate.code}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{rate.code}</span>
                  <span className="text-xs text-muted-foreground">{rate.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Alış:</span>
                    <span className="text-sm font-medium">₺{rate.buy.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Satış:</span>
                    <span className="text-sm font-medium">₺{rate.sell.toFixed(4)}</span>
                  </div>
                </div>
                {rate.change !== undefined && (
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      rate.change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {rate.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">{Math.abs(rate.change).toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
