'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
// import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardError } from '@/components/errors/DashboardError';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { PageLayout } from '@/components/layouts/PageLayout';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B9D',
];

function FinancialDashboardPageContent() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(subMonths(new Date(), 11)),
    to: endOfMonth(new Date()),
  });

  // Fetch dashboard stats from server-side aggregation API
  const { data: stats } = useQuery({
    queryKey: ['financial-stats', dateRange.from, dateRange.to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());
      
      const res = await fetch(`/api/financial/stats?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Finansal istatistikler alınamadı');
      }
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const metrics = stats?.data?.totals;

  const monthlyData = useMemo(() => {
    if (!stats?.data?.trends) return [];
    return stats.data.trends.map((t: { date: string; income: number; expense: number }) => ({
      month: t.date,
      income: t.income,
      expenses: t.expense,
    }));
  }, [stats]);

  const incomeByCategory = useMemo(() => {
    if (!stats?.data?.categories?.income) return [];
    return Object.entries(stats.data.categories.income).map(([name, value]) => ({
      name,
      value: value as number,
    }));
  }, [stats]);

  const expensesByCategory = useMemo(() => {
    if (!stats?.data?.categories?.expense) return [];
    return Object.entries(stats.data.categories.expense).map(([name, value]) => ({
      name,
      value: value as number,
    }));
  }, [stats]);

  // Fetch all records for table view

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    if (!monthlyData) return [];
    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;
    return monthlyData.map((item: { month: string; income: number; expenses: number }) => {
      cumulativeIncome += item.income;
      cumulativeExpenses += item.expenses;
      return {
        month: item.month,
        cumulativeIncome,
        cumulativeExpenses,
        cumulativeNet: cumulativeIncome - cumulativeExpenses,
      };
    });
  }, [monthlyData]);

  const handleExport = () => {
    // PDF/Excel export uses jsPDF and ExcelJS libraries
    // See src/lib/export/export-service.ts for exportToPDF and exportToExcel functions
    // See docs/ISSUES.md - Issue #4: Financial Reports Export
    if (process.env.NODE_ENV === 'development') {
      logger.info('Exporting financial data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMM yyyy', { locale: tr });
  };

  return (
    <PageLayout title="Finansal Dashboard" description="Mali durumu görsel olarak takip edin">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[300px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM yyyy', { locale: tr })} -{' '}
                    {format(dateRange.to, 'dd MMM yyyy', { locale: tr })}
                  </>
                ) : (
                  format(dateRange.from, 'dd MMM yyyy', { locale: tr })
                )
              ) : (
                <span>Tarih aralığı seçin</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateRange({
                    from: startOfMonth(new Date()),
                    to: endOfMonth(new Date()),
                  });
                }}
                className="w-full"
              >
                Bu Ay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateRange({
                    from: startOfMonth(subMonths(new Date(), 1)),
                    to: endOfMonth(subMonths(new Date(), 1)),
                  })
                }
                className="w-full"
              >
                Geçen Ay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateRange({
                    from: startOfMonth(subMonths(new Date(), 11)),
                    to: endOfMonth(new Date()),
                  })
                }
                className="w-full"
              >
                Son 12 Ay
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics ? formatCurrency(metrics.totalIncome || 0) : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics ? formatCurrency(metrics.totalExpenses || 0) : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Bakiye</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                metrics && (metrics.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {metrics ? formatCurrency(metrics.netIncome || 0) : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşlem Sayısı</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recordCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Aylık Trend</TabsTrigger>
          <TabsTrigger value="cumulative">Kümülatif</TabsTrigger>
          <TabsTrigger value="income-breakdown">Gelir Dağılımı</TabsTrigger>
          <TabsTrigger value="expense-breakdown">Gider Dağılımı</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aylık Gelir-Gider Trendi</CardTitle>
              <CardDescription>Son 12 ayın gelir ve gider karşılaştırması</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={formatMonth}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Gelir" fill="#10b981" />
                  <Bar dataKey="expenses" name="Gider" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cumulative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kümülatif Nakit Akışı</CardTitle>
              <CardDescription>Zaman içindeki biriken gelir ve gider</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={formatMonth}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cumulativeIncome"
                    name="Kümülatif Gelir"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeExpenses"
                    name="Kümülatif Gider"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeNet"
                    name="Net Bakiye"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gelir Kategorileri</CardTitle>
              <CardDescription>Kategorilere göre gelir dağılımı</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={incomeByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: PieLabelRenderProps) => {
                      const labelName = typeof name === 'string' ? name : String(name ?? '');
                      const value = ((typeof percent === 'number' ? percent : 0) * 100).toFixed(0);
                      return `${labelName} (${value}%)`;
                    }}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(incomeByCategory || []).map((_item: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gider Kategorileri</CardTitle>
              <CardDescription>Kategorilere göre gider dağılımı</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={expensesByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: PieLabelRenderProps) => {
                      const labelName = typeof name === 'string' ? name : String(name ?? '');
                      const value = ((typeof percent === 'number' ? percent : 0) * 100).toFixed(0);
                      return `${labelName} (${value}%)`;
                    }}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(expensesByCategory || []).map((_item: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

export default function FinancialDashboardPage() {
  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <FinancialDashboardPageContent />
    </ErrorBoundary>
  );
}
