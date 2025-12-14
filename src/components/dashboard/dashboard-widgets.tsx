'use client';

import { ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { WidgetConfig } from '@/types/dashboard';
import { WidgetContainer } from './widget-container';
import { WidgetSkeleton } from '@/components/ui/skeleton-variants';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { KPICard } from '@/components/ui/kpi-card';
import { CurrencyWidget } from '@/components/ui/currency-widget';
import { monitoringApi } from '@/lib/api/client';
import {
    Users,
    Heart,
    TrendingUp,

    ListTodo,
    ClipboardList,
    Calendar,
    CalendarCheck,


    ArrowUpRight,

    Clock,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Lazy load chart components
const DonationTrendChart = dynamic(
    () => import('@/components/charts/DashboardCharts').then((mod) => mod.DonationTrendChart),
    { ssr: false, loading: () => <WidgetSkeleton type="chart" /> }
);

const CategoryChart = dynamic(
    () => import('@/components/charts/DashboardCharts').then((mod) => mod.CategoryChart),
    { ssr: false, loading: () => <WidgetSkeleton type="chart" /> }
);

interface DashboardWidgetsProps {
    onToggleWidget?: (widgetId: string) => void;
    isEditMode?: boolean;
}

/**
 * Dashboard Widgets - Renders individual widget content based on type
 */
export function useDashboardWidgets({ onToggleWidget, isEditMode }: DashboardWidgetsProps) {
    // Fetch KPIs
    const { data: enhancedKPIs } = useQuery({
        queryKey: ['monitoring', 'kpis'],
        queryFn: async () => {
            const res = await monitoringApi.getEnhancedKPIs();
            if (!res.data) throw new Error(res.error || 'Failed to fetch KPIs');
            return res.data;
        },
        initialData: {
            pendingOperations: { total: 0, tasks: 0, applications: 0, trend: 0 },
            trackedWorkItems: { total: 0, active: 0, trend: 0 },
            calendarEvents: { total: 0, upcoming: 0, trend: 0 },
            plannedMeetings: { total: 0, thisWeek: 0 },
        },
    });

    // Fetch stats
    const { data: dashboardStats } = useQuery({
        queryKey: ['monitoring', 'stats'],
        queryFn: async () => {
            const res = await monitoringApi.getDashboardStats();
            if (!res.data) throw new Error(res.error || 'Failed to fetch stats');
            return res.data;
        },
        initialData: {
            beneficiaries: { total: 0, recent: 0 },
            donations: { total: 0, recent: 0, totalAmount: 0 },
            users: { active: 0 },
        },
    });

    // Fetch currency rates
    const { data: currencyData } = useQuery({
        queryKey: ['monitoring', 'currency'],
        queryFn: async () => {
            const res = await monitoringApi.getCurrencyRates();
            if (!res.data) throw new Error(res.error || 'Failed to fetch currency');
            return res.data;
        },
        refetchInterval: 300000,
        initialData: { rates: [], lastUpdate: new Date().toISOString() },
    });

    // Fetch chart data
    const { data: chartData } = useQuery({
        queryKey: ['dashboard', 'charts'],
        queryFn: async () => {
            const response = await fetch('/api/dashboard/charts');
            if (!response.ok) throw new Error('Failed to fetch chart data');
            const data = await response.json();
            return data.data;
        },
        staleTime: 5 * 60 * 1000,
        initialData: {
            donationTrend: [],
            categoryData: [{ name: 'Genel Bağış', value: 100, color: '#8884d8' }],
        },
    });

    // Fetch recent activities
    const { data: auditLogsData } = useQuery({
        queryKey: ['audit-logs', 'recent'],
        queryFn: async () => {
            const response = await fetch('/api/audit-logs?limit=5');
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const result = await response.json();
            return result.data || [];
        },
        staleTime: 60 * 1000,
        initialData: [],
    });

    // Render widget content based on type
    const renderWidgetContent = (widget: WidgetConfig): ReactNode => {
        switch (widget.type) {
            case 'stats':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                        {[
                            {
                                title: 'Bekleyen İşlemler',
                                value: enhancedKPIs.pendingOperations.total,
                                icon: ListTodo,
                                colorTheme: 'orange' as const,
                                description: `${enhancedKPIs.pendingOperations.tasks} görev`,
                            },
                            {
                                title: 'Takipteki İşler',
                                value: enhancedKPIs.trackedWorkItems.total,
                                icon: ClipboardList,
                                colorTheme: 'blue' as const,
                                description: `${enhancedKPIs.trackedWorkItems.active} aktif`,
                            },
                            {
                                title: 'Takvim Etkinlikleri',
                                value: enhancedKPIs.calendarEvents.total,
                                icon: Calendar,
                                colorTheme: 'gray' as const,
                                description: `${enhancedKPIs.calendarEvents.upcoming} yaklaşan`,
                            },
                            {
                                title: 'Toplantılar',
                                value: enhancedKPIs.plannedMeetings.total,
                                icon: CalendarCheck,
                                colorTheme: 'purple' as const,
                                description: `Bu hafta ${enhancedKPIs.plannedMeetings.thisWeek}`,
                            },
                            {
                                title: 'İhtiyaç Sahipleri',
                                value: dashboardStats.beneficiaries.total,
                                icon: Users,
                                colorTheme: 'blue' as const,
                                description: `+${dashboardStats.beneficiaries.recent} bu ay`,
                            },
                            {
                                title: 'Toplam Bağış',
                                value: dashboardStats.donations.total,
                                icon: Heart,
                                colorTheme: 'green' as const,
                                description: `+${dashboardStats.donations.recent} bu ay`,
                            },
                        ].map((kpi) => (
                            <KPICard key={kpi.title} {...kpi} />
                        ))}
                    </div>
                );

            case 'chart':
                if (widget.id === 'donation-chart') {
                    return (
                        <Suspense fallback={<WidgetSkeleton type="chart" />}>
                            <div className="h-28 w-full">
                                <DonationTrendChart data={chartData?.donationTrend || []} />
                            </div>
                        </Suspense>
                    );
                }
                if (widget.id === 'beneficiary-chart') {
                    return (
                        <Suspense fallback={<WidgetSkeleton type="chart" />}>
                            <div className="h-28 w-full">
                                <CategoryChart data={chartData?.categoryData || []} />
                            </div>
                        </Suspense>
                    );
                }
                return <WidgetSkeleton type="chart" />;

            case 'activity':
                return (
                    <div className="space-y-3">
                        {auditLogsData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Henüz aktivite yok</p>
                            </div>
                        ) : (
                            auditLogsData.slice(0, 5).map((log: { $id: string; action: string; resource: string; $createdAt: string }, index: number) => (
                                <div
                                    key={log.$id || index}
                                    className="flex items-start gap-3 p-2 rounded-lg border bg-card"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{log.action}</p>
                                        <p className="text-xs text-muted-foreground">{log.resource}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'quick-actions':
                const quickActions = [
                    { title: 'İhtiyaç Sahipleri', href: '/yardim/ihtiyac-sahipleri', icon: Users, color: 'bg-blue-500/10', iconColor: 'text-blue-600' },
                    { title: 'Bağışlar', href: '/bagis/liste', icon: Heart, color: 'bg-red-500/10', iconColor: 'text-red-600' },
                    { title: 'Raporlar', href: '/bagis/raporlar', icon: TrendingUp, color: 'bg-green-500/10', iconColor: 'text-green-600' },
                ];
                return (
                    <div className="space-y-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.title} href={action.href}>
                                    <div className="group flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer">
                                        <div className={cn('p-2 rounded-lg', action.color)}>
                                            <Icon className={cn('h-4 w-4', action.iconColor)} />
                                        </div>
                                        <span className="font-medium text-sm group-hover:text-primary">{action.title}</span>
                                        <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                );

            case 'currency':
                return (
                    <CurrencyWidget
                        rates={currencyData?.rates || []}
                        lastUpdate={currencyData?.lastUpdate ? new Date(currencyData.lastUpdate).toLocaleString('tr-TR') : undefined}
                        isLoading={!currencyData}
                    />
                );

            case 'table':
                // Yaklaşan Görevler widget
                return (
                    <div className="space-y-3">
                        <div className="text-center py-8 text-muted-foreground">
                            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Yaklaşan görev bulunmuyor</p>
                            <p className="text-xs mt-1">Yeni görevler burada görünecek</p>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Yeni bildirim yok</p>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Widget yüklenemedi</p>
                    </div>
                );
        }
    };

    // Render full widget with container (wrapped in error boundary)
    const renderWidget = (widget: WidgetConfig): ReactNode => {
        return (
            <ErrorBoundary
                key={`error-boundary-${widget.id}`}
                fallback={
                    <WidgetContainer widget={widget} isEditMode={isEditMode}>
                        <div className="flex items-center justify-center h-full text-center py-8">
                            <div className="text-muted-foreground">
                                <p className="text-sm font-medium text-destructive">Widget yüklenemedi</p>
                                <p className="text-xs mt-1">Bu widget geçici olarak kullanılamıyor</p>
                            </div>
                        </div>
                    </WidgetContainer>
                }
            >
                <WidgetContainer
                    widget={widget}
                    isEditMode={isEditMode}
                    onHide={() => onToggleWidget?.(widget.id)}
                >
                    {renderWidgetContent(widget)}
                </WidgetContainer>
            </ErrorBoundary>
        );
    };

    return {
        renderWidget,
        renderWidgetContent,
        data: {
            enhancedKPIs,
            dashboardStats,
            currencyData,
            chartData,
            auditLogsData,
        },
    };
}

export default useDashboardWidgets;
