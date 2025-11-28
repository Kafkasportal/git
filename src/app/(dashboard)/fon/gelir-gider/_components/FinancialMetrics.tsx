'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/financial/calculations';
import type { FinancialStats } from '@/lib/financial/calculations';

interface FinancialMetricsProps {
  stats: FinancialStats;
  isLoading?: boolean;
}

export function FinancialMetrics({ stats, isLoading }: FinancialMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2" />
              <div className="h-3 bg-muted rounded w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalIncome)}
          </div>
          {stats.pendingIncome > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.pendingIncome)} beklemede
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Expense */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalExpense)}
          </div>
          {stats.pendingExpense > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.pendingExpense)} beklemede
            </p>
          )}
        </CardContent>
      </Card>

      {/* Net Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Gelir</CardTitle>
          <DollarSign
            className={`h-4 w-4 ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(stats.netIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.approvedRecords} onaylı kayıt</p>
        </CardContent>
      </Card>

      {/* Total Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRecords}</div>
          <p className="text-xs text-muted-foreground mt-1">Toplam işlem</p>
        </CardContent>
      </Card>
    </div>
  );
}
