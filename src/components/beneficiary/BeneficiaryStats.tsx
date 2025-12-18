'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  WorkflowStage,
  STAGE_LABELS,
} from '@/lib/beneficiary/workflow-engine';

interface BeneficiaryStatsProps {
  className?: string;
}

interface StatsData {
  total: number;
  active: number;
  pending: number;
  completed: number;
  rejected: number;
  thisMonth: number;
  lastMonth: number;
  byStage: Partial<Record<WorkflowStage, number>>;
  byCategory: { category: string; count: number }[];
}

/**
 * Yardım modülü istatistik kartları
 */
export function BeneficiaryStats({ className }: BeneficiaryStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['beneficiary-stats'],
    queryFn: async () => {
      const response = await fetch('/api/beneficiaries?limit=1000');
      if (!response.ok) throw new Error('İstatistikler alınamadı');
      const result = await response.json();

      // Calculate stats from data
      const beneficiaries = result.data || [];
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const stats: StatsData = {
        total: beneficiaries.length,
        active: beneficiaries.filter((b: Record<string, unknown>) =>
          b.status === 'AKTIF' || b.workflowStage === WorkflowStage.APPROVED ||
          b.workflowStage === WorkflowStage.IN_DISTRIBUTION
        ).length,
        pending: beneficiaries.filter((b: Record<string, unknown>) =>
          b.workflowStage === WorkflowStage.SUBMITTED ||
          b.workflowStage === WorkflowStage.UNDER_REVIEW ||
          b.workflowStage === WorkflowStage.NEEDS_INFO
        ).length,
        completed: beneficiaries.filter((b: Record<string, unknown>) =>
          b.workflowStage === WorkflowStage.COMPLETED
        ).length,
        rejected: beneficiaries.filter((b: Record<string, unknown>) =>
          b.workflowStage === WorkflowStage.REJECTED
        ).length,
        thisMonth: beneficiaries.filter((b: Record<string, unknown>) =>
          new Date(b.$createdAt as string) >= thisMonthStart
        ).length,
        lastMonth: beneficiaries.filter((b: Record<string, unknown>) => {
          const created = new Date(b.$createdAt as string);
          return created >= lastMonthStart && created <= lastMonthEnd;
        }).length,
        byStage: {} as Record<WorkflowStage, number>,
        byCategory: [],
      };

      // Count by stage
      for (const stage of Object.values(WorkflowStage)) {
        stats.byStage[stage] = beneficiaries.filter(
          (b: Record<string, unknown>) => b.workflowStage === stage
        ).length;
      }

      // Count by category
      const categories: Record<string, number> = {};
      for (const b of beneficiaries) {
        const cat = (b.category as string) || 'Belirsiz';
        categories[cat] = (categories[cat] || 0) + 1;
      }
      stats.byCategory = Object.entries(categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 grid-cols-2 grid-cols-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = data || {
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    thisMonth: 0,
    lastMonth: 0,
    byStage: {},
    byCategory: [],
  };

  const monthlyChange = stats.lastMonth > 0
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
    : stats.thisMonth > 0 ? 100 : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Stats */}
      <div className="grid gap-4 grid-cols-2 grid-cols-4">
        {/* Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {monthlyChange >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{monthlyChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{monthlyChange.toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Yardım</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <Progress
              value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
              className="h-1 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              %{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0} oranında
            </p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            {stats.pending > 0 && (
              <Link
                href="/yardim/basvurular?status=pending"
                className="text-xs text-primary hover:underline flex items-center mt-2"
              >
                Bekleyen başvuruları görüntüle
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Geçen ay: {stats.lastMonth} kayıt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Status Overview */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Durumu</CardTitle>
            <CardDescription>Başvuruların aşamalara göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(STAGE_LABELS).map(([stage, info]) => {
                const count = stats.byStage[stage as WorkflowStage] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn('text-xs', info.color)}>
                          {info.label}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategori Dağılımı</CardTitle>
            <CardDescription>En yoğun yardım kategorileri</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz veri yok
              </p>
            ) : (
              <div className="space-y-3">
                {stats.byCategory.map((item) => {
                  const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;

                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.category.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/yardim/ihtiyac-sahipleri?new=true">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                <UserPlus className="h-3 w-3 mr-1" />
                Yeni Kayıt
              </Badge>
            </Link>
            <Link href="/yardim/basvurular?stage=under_review">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                <Clock className="h-3 w-3 mr-1" />
                İnceleme Bekleyenler ({stats.byStage[WorkflowStage.UNDER_REVIEW] || 0})
              </Badge>
            </Link>
            <Link href="/yardim/basvurular?stage=approved">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                <FileCheck className="h-3 w-3 mr-1" />
                Onaylananlar ({stats.byStage[WorkflowStage.APPROVED] || 0})
              </Badge>
            </Link>
            <Link href="/yardim/basvurular?stage=needs_info">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Bilgi Bekleyenler ({stats.byStage[WorkflowStage.NEEDS_INFO] || 0})
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
