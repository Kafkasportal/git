 'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/layouts/PageLayout';
import { DemoBanner } from '@/components/ui/demo-banner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardError } from '@/components/errors/DashboardError';
import { TrendingUp, Users, MousePointerClick, Clock, Activity, Eye, Zap } from 'lucide-react';
import SessionTracking from '@/lib/analytics/session-tracking';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/client';

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

const mockCoreWebVitals = [
  { metric: 'LCP', value: 2.1, threshold: 2.5, status: 'good' },
  { metric: 'FID', value: 45, threshold: 100, status: 'good' },
  { metric: 'CLS', value: 0.08, threshold: 0.1, status: 'good' },
  { metric: 'TTFB', value: 420, threshold: 600, status: 'good' },
];

function AnalyticsPageContent() {
  const recharts = useRecharts();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeRange] = useState<'day' | 'week' | 'month'>('week');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: async () => {
      const res = await analyticsApi.getStats({ limit: 1000 });
      if (!res.data) throw new Error(res.error || 'Failed to fetch analytics');
      return res.data;
    },
    initialData: {
      totalEvents: 0,
      uniqueUsers: 0,
      eventCounts: {},
      pageViews: {},
      recentEvents: [],
    },
  });

  // Get session metrics from session tracking module
  const sessionMetrics = useMemo(() => {
    if (typeof globalThis.window !== 'undefined') {
      return SessionTracking.getSessionMetrics();
    }
    return { avgSessionDuration: 0, bounceRate: 0, pagesPerSession: 0, totalSessions: 0, activeSessions: 0 };
  }, []);

  const stats = useMemo(
    () => ({
      totalEvents: analyticsData.totalEvents,
      totalUsers: analyticsData.uniqueUsers,
      avgSessionDuration: sessionMetrics.avgSessionDuration,
      bounceRate: Math.round(sessionMetrics.bounceRate),
    }),
    [analyticsData, sessionMetrics]
  );

  const pageViewsData = useMemo(() => {
    return Object.entries(analyticsData.pageViews || {})
      .map(([page, views]) => ({
        page,
        views: views as number,
        avgTime: 0, // Not yet implemented
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [analyticsData.pageViews]);

  const eventTypesData = useMemo(() => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];
    return Object.entries(analyticsData.eventCounts || {}).map(([name, value], index) => ({
      name,
      value: value as number,
      color: colors[index % colors.length],
    }));
  }, [analyticsData.eventCounts]);

  if (isLoading) {
    return (
      <PageLayout title="Analitik Dashboard" description="Yükleniyor...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-success';
      case 'needs-improvement':
        return 'text-warning';
      case 'poor':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVitalStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-success text-success-foreground">İyi</Badge>;
      case 'needs-improvement':
        return <Badge className="bg-warning text-warning-foreground">Geliştirilmeli</Badge>;
      case 'poor':
        return <Badge variant="destructive">Zayıf</Badge>;
      default:
        return <Badge variant="outline">Bilinmiyor</Badge>;
    }
  };

  return (
    <PageLayout
      title="Analitik Dashboard"
      description="Kullanıcı davranışı ve sistem performansı takibi"
      badge={{ text: `${stats.totalEvents.toLocaleString('tr-TR')} Olay`, variant: 'default' }}
    >
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Olay</CardTitle>
            <Activity className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Son {timeRange === 'day' ? '24 saat' : timeRange === 'week' ? '7 gün' : '30 gün'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% geçen haftaya göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Oturum</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.avgSessionDuration / 60)}dk</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgSessionDuration % 60}sn ortalama
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hemen Çıkma</CardTitle>
            <MousePointerClick className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{stats.bounceRate}</div>
            <p className="text-xs text-muted-foreground mt-1">İdeal: %40&apos;ın altında</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pages">Sayfa Görüntüleme</TabsTrigger>
          <TabsTrigger value="activity">Kullanıcı Aktivitesi</TabsTrigger>
          <TabsTrigger value="events">Olay Türleri</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
        </TabsList>

        {/* Page Views Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                En Çok Görüntülenen Sayfalar
              </CardTitle>
              <CardDescription>Sayfa başına görüntüleme ve ortalama kalma süresi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {recharts ? (
                  (() => {
                    const {
                      BarChart,
                      Bar,
                      XAxis,
                      YAxis,
                      CartesianGrid,
                      Tooltip,
                      Legend,
                      ResponsiveContainer,
                    } = recharts;
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pageViewsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="page" angle={-45} textAnchor="end" height={100} />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="views" fill="#8884d8" name="Görüntüleme" />
                          <Bar yAxisId="right" dataKey="avgTime" fill="#82ca9d" name="Ort. Süre (sn)" />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()
                ) : (
                  <div className="h-full w-full rounded-md bg-muted animate-pulse" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Saatlik Aktivite</CardTitle>
                <CardDescription>
                  Kullanıcı etkinliği saatlik dağılım (Henüz aktif değil)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Veri toplanıyor...
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En Aktif Kullanıcılar</CardTitle>
                <CardDescription>Son 7 güne göre (Henüz aktif değil)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Veri toplanıyor...
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Event Types Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Olay Türleri Dağılımı</CardTitle>
              <CardDescription>Kullanıcı etkileşim türleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center">
                {recharts ? (
                  (() => {
                    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = recharts;
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={eventTypesData}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {eventTypesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()
                ) : (
                  <div className="h-96 w-full rounded-md bg-muted animate-pulse" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>Sayfa performans metrikleri (Google standartları)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockCoreWebVitals.map((vital) => (
                  <div key={vital.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{vital.metric}</p>
                        <p className="text-sm text-muted-foreground">
                          {vital.metric === 'LCP' && 'Largest Contentful Paint'}
                          {vital.metric === 'FID' && 'First Input Delay'}
                          {vital.metric === 'CLS' && 'Cumulative Layout Shift'}
                          {vital.metric === 'TTFB' && 'Time to First Byte'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getVitalStatusColor(vital.status)}`}>
                          {vital.value}
                          {vital.metric === 'LCP' && 's'}
                          {vital.metric === 'FID' && 'ms'}
                          {vital.metric === 'TTFB' && 'ms'}
                        </p>
                        {getVitalStatusBadge(vital.status)}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${vital.status === 'good'
                            ? 'bg-success'
                            : vital.status === 'needs-improvement'
                              ? 'bg-warning'
                              : 'bg-error'
                          }`}
                        style={{
                          width: `${Math.min((vital.value / vital.threshold) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hedef: {vital.threshold}
                      {vital.metric === 'LCP' && 's'}
                      {vital.metric === 'FID' && 'ms'}
                      {vital.metric === 'TTFB' && 'ms'} veya altı
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performans Önerileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <Badge className="bg-success text-success-foreground mt-0.5">İyi</Badge>
                  <div>
                    <p className="font-medium text-foreground">Genel Performans</p>
                    <p className="text-sm text-muted-foreground">
                      Tüm Core Web Vitals metrikleri iyi seviyede. Mevcut optimizasyonları koruyun.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg">
                  <Badge className="bg-info text-info-foreground mt-0.5">Öneri</Badge>
                  <div>
                    <p className="font-medium text-foreground">Görsel Optimizasyon</p>
                    <p className="text-sm text-muted-foreground">
                      Görseller için WebP formatı kullanmaya devam edin. LCP performansını korur.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <Badge className="bg-primary text-primary-foreground mt-0.5">İzleme</Badge>
                  <div>
                    <p className="font-medium text-foreground">Sürekli İzleme</p>
                    <p className="text-sm text-muted-foreground">
                      Performans metriklerini düzenli olarak kontrol edin. Yeni özellikler
                      performansı etkileyebilir.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

export default function AnalyticsPage() {
  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <AnalyticsPageContent />
    </ErrorBoundary>
  );
}
