'use client';

import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { KPICard } from '@/components/ui/kpi-card';
import { CurrencyWidget } from '@/components/ui/currency-widget';
import { PageLayout } from '@/components/layouts/PageLayout';
import { DemoBanner } from '@/components/ui/demo-banner';
// api removed
import {
  Users,
  Heart,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  ListTodo,
  ClipboardList,
  Calendar,
  CalendarCheck,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Suspense, useMemo } from 'react';

// Lazy load chart components to reduce initial bundle size
const DynamicAreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
});

const DynamicArea = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });

const DynamicXAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });

const DynamicYAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });

const DynamicCartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
  ssr: false,
});

const DynamicTooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });

const DynamicResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

const DynamicPieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
});

const DynamicPie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false });

const DynamicCell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false });

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Mock data for Appwrite migration
  const enhancedKPIs = {
    pendingOperations: { total: 0, tasks: 0, applications: 0, trend: 0 },
    trackedWorkItems: { total: 0, active: 0, trend: 0 },
    calendarEvents: { total: 0, upcoming: 0, trend: 0 },
    plannedMeetings: { total: 0, thisWeek: 0 },
  };

  const dashboardStats = {
    beneficiaries: { total: 0, recent: 0 },
    donations: { total: 0, recent: 0, totalAmount: 0 },
    users: { active: 0 },
  };

  const currencyData = {
    rates: [],
    lastUpdate: new Date().toISOString(),
  };

  /*
  // Fetch enhanced KPIs and currency rates with real-time updates
  const enhancedKPIs = useQuery(api.monitoring.getEnhancedKPIs);
  const currencyData = useRealtimeQuery(
    api.monitoring.getCurrencyRates,
    {},
    {
      notifyOnChange: true,
      changeMessage: 'Döviz kurları güncellendi',
      skipInitial: true,
    }
  );
  const dashboardStats = useRealtimeQuery(
    api.monitoring.getDashboardStats,
    {},
    {
      notifyOnChange: false, // Too frequent, no notification
      skipInitial: true,
    }
  );
  */

  // ⚠️ DEMO DATA: Aşağıdaki veriler gerçek API'lerden alınmalı (bkz: docs/ISSUES.md - Mock Data)
  // Sample chart data - memoized to prevent re-renders (moved before early returns)
  const donationData = useMemo(
    () => [
      { month: 'Oca', amount: 4500, beneficiaries: 12 },
      { month: 'Şub', amount: 5200, beneficiaries: 15 },
      { month: 'Mar', amount: 4800, beneficiaries: 11 },
      { month: 'Nis', amount: 6100, beneficiaries: 18 },
      { month: 'May', amount: 5800, beneficiaries: 16 },
      { month: 'Haz', amount: 7200, beneficiaries: 22 },
    ],
    []
  );

  const categoryData = useMemo(
    () => [
      { name: 'Ramazan Paketi', value: 35, color: '#8884d8' },
      { name: 'Eğitim Yardımı', value: 25, color: '#82ca9d' },
      { name: 'Sağlık Desteği', value: 20, color: '#ffc658' },
      { name: 'Gıda Yardımı', value: 15, color: '#ff7300' },
      { name: 'Diğer', value: 5, color: '#00ff00' },
    ],
    []
  );

  // Show loading if still loading
  if (isLoading || !enhancedKPIs || !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="dashboard-root">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="dashboard-root">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Kimlik Doğrulama Hatası</h2>
          <p className="text-gray-600 mt-2">Lütfen tekrar giriş yapın.</p>
        </div>
      </div>
    );
  }

  // ⚠️ DEMO DATA: Bu değerler gerçek API'lerden alınmalı
  const stats = [
    {
      title: 'Toplam İhtiyaç Sahibi',
      value: dashboardStats.beneficiaries.total.toString(),
      icon: Users,
      variant: 'blue' as const,
      trend: {
        value: `+${dashboardStats.beneficiaries.recent}`,
        direction: 'up' as const,
      },
      progress: 85,
      sparkles: true,
      description: `Bu ay ${dashboardStats.beneficiaries.recent} yeni kayıt`,
    },
    {
      title: 'Toplam Bağış',
      value: dashboardStats.donations.total.toString(),
      icon: Heart,
      variant: 'red' as const,
      trend: {
        value: `+${dashboardStats.donations.recent}`,
        direction: 'up' as const,
      },
      progress: 92,
      description: `Bu ay ${dashboardStats.donations.recent} yeni bağış`,
    },
    {
      title: 'Bağış Tutarı',
      value: `₺${dashboardStats.donations.totalAmount.toLocaleString('tr-TR')}`,
      icon: DollarSign,
      variant: 'green' as const,
      trend: { value: '+15%', direction: 'up' as const },
      progress: 78,
      sparkles: true,
      description: 'Hedef: ₺200,000',
    },
    {
      title: 'Aktif Kullanıcı',
      value: dashboardStats.users.active.toString(),
      icon: TrendingUp,
      variant: 'purple' as const,
      trend: { value: `+${dashboardStats.users.active}`, direction: 'up' as const },
      progress: 65,
      description: 'Son 30 günde aktif',
    },
  ];

  // Enhanced KPI Cards from design document
  const enhancedKPICards = [
    {
      title: 'Bekleyen İşlemler',
      value: enhancedKPIs.pendingOperations.total,
      icon: ListTodo,
      colorTheme: 'green' as const,
      description: `${enhancedKPIs.pendingOperations.tasks} görev, ${enhancedKPIs.pendingOperations.applications} başvuru`,
      trend: {
        value: `+${enhancedKPIs.pendingOperations.trend}`,
        direction: 'up' as const,
      },
    },
    {
      title: 'Takipteki İş Kayıtları',
      value: enhancedKPIs.trackedWorkItems.total,
      icon: ClipboardList,
      colorTheme: 'orange' as const,
      description: `${enhancedKPIs.trackedWorkItems.active} aktif iş akışı`,
      trend: {
        value: `+${enhancedKPIs.trackedWorkItems.trend}`,
        direction: 'up' as const,
      },
    },
    {
      title: 'Takvim Etkinlikleri',
      value: enhancedKPIs.calendarEvents.total,
      icon: Calendar,
      colorTheme: 'blue' as const,
      description: `${enhancedKPIs.calendarEvents.upcoming} yaklaşan toplantı`,
      trend: {
        value: `+${enhancedKPIs.calendarEvents.trend}`,
        direction: 'up' as const,
      },
    },
    {
      title: 'Planlanmış Toplantılar',
      value: enhancedKPIs.plannedMeetings.total,
      icon: CalendarCheck,
      colorTheme: 'red' as const,
      description: `Bu hafta ${enhancedKPIs.plannedMeetings.thisWeek} toplantı`,
    },
    {
      title: 'Kurul ve Komisyonlar',
      value: '0',
      icon: UserCheck,
      colorTheme: 'gray' as const,
      description: 'Üye olduğunuz kurul sayısı',
    },
    {
      title: 'Seyahat Kayıtları',
      value: '0',
      icon: Briefcase,
      colorTheme: 'purple' as const,
      description: 'Planlı seyahat kayıtları',
    },
  ];

  const quickActions = [
    {
      title: 'İhtiyaç Sahipleri',
      description: 'Kayıtlı ihtiyaç sahiplerini görüntüle ve yönet',
      icon: Users,
      href: '/yardim/ihtiyac-sahipleri',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Bağışlar',
      description: 'Bağış kayıtlarını görüntüle ve yönet',
      icon: Heart,
      href: '/bagis/liste',
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Raporlar',
      description: 'Detaylı raporları ve istatistikleri incele',
      icon: BarChart3,
      href: '/bagis/raporlar',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  const recentActivities = [
    {
      type: 'success',
      title: 'Yeni bağış kaydedildi',
      description: '500 ₺ bağış kaydı oluşturuldu',
      time: '2 dakika önce',
      icon: CheckCircle2,
    },
    {
      type: 'info',
      title: 'İhtiyaç sahibi güncellendi',
      description: 'Ahmet Yılmaz bilgileri güncellendi',
      time: '15 dakika önce',
      icon: AlertCircle,
    },
    {
      type: 'success',
      title: 'Yeni kullanıcı eklendi',
      description: 'Yeni yetkili kullanıcı oluşturuldu',
      time: '1 saat önce',
      icon: Users,
    },
  ];

  return (
    <div data-testid="dashboard-root">
      <PageLayout
        title={`Hoş geldiniz, ${user?.name || 'Kullanıcı'}!`}
        description="Sistemin genel durumunu buradan takip edebilirsiniz"
        badge={{ text: 'Sistem Aktif', variant: 'default' }}
      >
        {/* Demo Mode Banner */}
        <DemoBanner />

        {/* Enhanced KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {enhancedKPICards.map((kpi) => (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              colorTheme={kpi.colorTheme}
              description={kpi.description}
              trend={kpi.trend}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Donation Trend Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Bağış Trendi</CardTitle>
                  <CardDescription className="mt-1">
                    Son 6 aylık bağış miktarı ve ihtiyaç sahibi sayısı
                  </CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
              >
                <div className="h-64 w-full">
                  <DynamicResponsiveContainer width="100%" height={256}>
                    <DynamicAreaChart data={donationData}>
                      <DynamicCartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <DynamicXAxis dataKey="month" className="text-xs" />
                      <DynamicYAxis className="text-xs" />
                      <DynamicTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <DynamicArea
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
                    </DynamicAreaChart>
                  </DynamicResponsiveContainer>
                </div>
              </Suspense>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Yardım Kategorileri</CardTitle>
                  <CardDescription className="mt-1">Yardım türlerine göre dağılım</CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
              >
                <div className="h-64 w-full">
                  <DynamicResponsiveContainer width="100%" height={256}>
                    <DynamicPieChart>
                      <DynamicPie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <DynamicCell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </DynamicPie>
                      <DynamicTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </DynamicPieChart>
                  </DynamicResponsiveContainer>
                </div>
              </Suspense>
              <div className="flex flex-wrap gap-2 mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Hızlı Erişim</CardTitle>
                    <CardDescription className="mt-1">
                      Sık kullanılan işlemlere hızlıca erişin
                    </CardDescription>
                  </div>
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.title} href={action.href} prefetch={true}>
                        <div
                          className={cn(
                            'group relative p-5 rounded-xl border transition-all duration-200',
                            'hover:shadow-md hover:border-primary/50 cursor-pointer',
                            'bg-card'
                          )}
                        >
                          <div
                            className={cn(
                              'inline-flex p-3 rounded-xl mb-3 transition-transform duration-200 group-hover:scale-105',
                              action.iconBg
                            )}
                          >
                            <Icon className={cn('h-5 w-5', action.iconColor)} />
                          </div>
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                          <ArrowUpRight className="h-4 w-4 absolute top-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Currency Widget */}
          <CurrencyWidget
            rates={currencyData?.rates || []}
            lastUpdate={
              currencyData?.lastUpdate
                ? new Date(currencyData.lastUpdate).toLocaleString('tr-TR')
                : undefined
            }
            isLoading={!currencyData}
          />
        </div>

        {/* Recent Activities and Old Stats Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Stats Grid - Now showing real data */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">İstatistikler</CardTitle>
                <CardDescription className="mt-1">Sistem genel özeti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {stats.map((stat) => (
                    <StatCard
                      key={stat.title}
                      title={stat.title}
                      value={stat.value}
                      icon={stat.icon}
                      variant={stat.variant}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Son Aktiviteler</CardTitle>
                  <CardDescription className="mt-1">Sistemdeki son işlemler</CardDescription>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full',
                          activity.type === 'success' && 'bg-green-500/10',
                          activity.type === 'info' && 'bg-blue-500/10',
                          activity.type === 'warning' && 'bg-yellow-500/10'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            activity.type === 'success' && 'text-green-600',
                            activity.type === 'info' && 'text-blue-600',
                            activity.type === 'warning' && 'text-yellow-600'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Donation Trend Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Bağış Trendi</CardTitle>
                  <CardDescription className="mt-1">
                    Son 6 aylık bağış miktarı ve ihtiyaç sahibi sayısı
                  </CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
              >
                <div className="h-64 w-full">
                  <DynamicResponsiveContainer width="100%" height={256}>
                    <DynamicAreaChart data={donationData}>
                      <DynamicCartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <DynamicXAxis dataKey="month" className="text-xs" />
                      <DynamicYAxis className="text-xs" />
                      <DynamicTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <DynamicArea
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
                    </DynamicAreaChart>
                  </DynamicResponsiveContainer>
                </div>
              </Suspense>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Yardım Kategorileri</CardTitle>
                  <CardDescription className="mt-1">Yardım türlerine göre dağılım</CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
              >
                <div className="h-64 w-full">
                  <DynamicResponsiveContainer width="100%" height={256}>
                    <DynamicPieChart>
                      <DynamicPie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <DynamicCell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </DynamicPie>
                      <DynamicTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </DynamicPieChart>
                  </DynamicResponsiveContainer>
                </div>
              </Suspense>
              <div className="flex flex-wrap gap-2 mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Sistem Durumu</CardTitle>
                <CardDescription className="mt-1">
                  Sistemin mevcut durumu ve performans metrikleri
                </CardDescription>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Veritabanı</p>
                    <p className="text-xs text-muted-foreground">Bağlantı aktif</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Aktif
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kimlik Doğrulama</p>
                    <p className="text-xs text-muted-foreground">Servis aktif</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Aktif
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">API Servisleri</p>
                    <p className="text-xs text-muted-foreground">Tüm servisler aktif</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Aktif
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </div>
  );
}
