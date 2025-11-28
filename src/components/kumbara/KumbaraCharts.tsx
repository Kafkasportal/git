'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/format';

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

interface LocationData {
  location: string;
  amount: number;
  count: number;
}

interface PaymentData {
  method: string;
  value: number;
  count: number;
  [key: string]: unknown;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload?: PaymentData }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-4 shadow-md">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-blue-600">{`Tutar: ${formatCurrency(payload[0].value)}`}</p>
        {payload[0].payload?.count && (
          <p className="text-sm text-green-600">{`Adet: ${payload[0].payload.count}`}</p>
        )}
      </div>
    );
  }
  return null;
};

export function KumbaraCharts() {
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyData[]>({
    queryKey: ['kumbara-monthly-stats'],
    queryFn: async () => {
      const response = await fetch('/api/kumbara/stats?type=monthly');
      if (!response.ok) {
        throw new Error('Aylık istatistikler yüklenemedi');
      }
      return response.json();
    },
  });

  const { data: locationData, isLoading: locationLoading } = useQuery<LocationData[]>({
    queryKey: ['kumbara-location-stats'],
    queryFn: async () => {
      const response = await fetch('/api/kumbara/stats?type=location');
      if (!response.ok) {
        throw new Error('Lokasyon istatistikleri yüklenemedi');
      }
      return response.json();
    },
  });

  const { data: paymentData, isLoading: paymentLoading } = useQuery<PaymentData[]>({
    queryKey: ['kumbara-payment-stats'],
    queryFn: async () => {
      const response = await fetch('/api/kumbara/stats?type=payment');
      if (!response.ok) {
        throw new Error('Ödeme yöntemi istatistikleri yüklenemedi');
      }
      return response.json();
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (monthlyLoading || locationLoading || paymentLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Aylık Trend Grafiği */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Aylık Kumbara Bağış Trendi</CardTitle>
          <CardDescription>Son 6 ayın kumbara bağış miktarları ve adetleri</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="amount"
                name="Tutar (₺)"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lokasyon Bazlı Dağılım */}
      <Card>
        <CardHeader>
          <CardTitle>Lokasyon Bazlı Dağılım</CardTitle>
          <CardDescription>Kumbara bağışlarının konumlara göre dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="location"
                className="text-xs"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Tutar (₺)" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ödeme Yöntemi Dağılımı */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Yöntemi Dağılımı</CardTitle>
          <CardDescription>Kumbara bağışlarının ödeme yöntemlerine göre dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const { method, percent } = props as { method?: string; percent?: number };
                  if (!method || percent === undefined) return '';
                  return `${method}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(paymentData || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Ödeme: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
