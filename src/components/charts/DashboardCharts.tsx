'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type RechartsModule = typeof import('recharts');

function useRecharts() {
  const [mod, setMod] = useState<RechartsModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('recharts')
      .then((m) => {
        if (!cancelled) setMod(m);
      })
      .catch(() => {
        // Ignore chart load errors; UI will keep fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return mod;
}

interface DonationTrendChartProps {
  data: Array<{ month: string; amount: number; beneficiaries?: number }>;
}

export function DonationTrendChart({ data }: DonationTrendChartProps) {
  const recharts = useRecharts();
  if (!recharts) {
    return <Skeleton className="h-64 w-full" />;
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = recharts;
  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#8884d8"
          fill="url(#colorAmount)"
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CategoryChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  const recharts = useRecharts();
  if (!recharts) {
    return <Skeleton className="h-64 w-full" />;
  }

  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = recharts;
  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
