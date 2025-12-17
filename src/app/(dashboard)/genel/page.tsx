'use client';

import { memo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { DemoBanner } from '@/components/ui/demo-banner';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardWidgets } from '@/components/dashboard/dashboard-widgets';
import WidgetGrid from '@/components/dashboard/widget-grid';
import { WidgetSkeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

interface DashboardHeroSectionProps {
  readonly userName: string;
  readonly isRealtimeConnected: boolean;
}

function DashboardHeroSection({
  userName,
  isRealtimeConnected,
}: DashboardHeroSectionProps) {
  const currentHour = new Date().getHours();
  let greeting: string;
  if (currentHour < 12) {
    greeting = 'Günaydın';
  } else if (currentHour < 18) {
    greeting = 'İyi günler';
  } else {
    greeting = 'İyi akşamlar';
  }

  const currentDate = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden"
    >
      {/* Hero Card with Glass Effect */}
      <div
        className={cn(
          'relative rounded-2xl p-6 md:p-8',
          'bg-gradient-to-br from-primary/5 via-transparent to-accent/5',
          'border border-border/50',
          'backdrop-blur-sm'
        )}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">
          {/* Top Row: Date & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{currentDate}</span>
            </div>
            <Badge
              variant={isRealtimeConnected ? 'default' : 'secondary'}
              className={cn(
                'px-3 py-1 font-medium transition-all duration-300',
                isRealtimeConnected && 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
              )}
            >
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full mr-2',
                  isRealtimeConnected
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted-foreground'
                )}
              />
              {isRealtimeConnected ? 'Canlı Bağlantı' : 'Sistem Aktif'}
            </Badge>
          </div>

          {/* Main Greeting */}
          <div className="space-y-2">
            <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Dernek yönetim panelinize hoş geldiniz. Sistemin genel durumunu
              buradan takip edebilirsiniz.
            </p>
          </div>

          {/* Quick Stats Row */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
          >
            {[
              {
                label: 'Bugünkü Görevler',
                value: '12',
                icon: Activity,
                trend: '+3',
                color: 'text-primary',
              },
              {
                label: 'Aktif Projeler',
                value: '8',
                icon: TrendingUp,
                trend: '+1',
                color: 'text-success',
              },
              {
                label: 'Bekleyen İşler',
                value: '24',
                icon: Clock,
                trend: '-5',
                color: 'text-warning',
              },
              {
                label: 'Bu Ay',
                value: '156',
                icon: Sparkles,
                trend: '+23%',
                color: 'text-info',
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className={cn(
                  'group relative p-4 rounded-xl',
                  'bg-card/50 backdrop-blur-sm',
                  'border border-border/50',
                  'hover:border-primary/30 hover:bg-card/80',
                  'transition-all duration-300 cursor-default'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className={cn('text-2xl font-bold', stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      'bg-gradient-to-br from-primary/10 to-primary/5',
                      'group-hover:from-primary/20 group-hover:to-primary/10',
                      'transition-all duration-300'
                    )}
                  >
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                {stat.trend && (
                  <p
                    className={cn(
                      'text-xs mt-2 font-medium',
                      stat.trend.startsWith('+')
                        ? 'text-success'
                        : 'text-warning'
                    )}
                  >
                    {stat.trend} bu hafta
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardPageComponent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const {
    widgets,
    visibleWidgets,
    layoutItems,
    isEditMode,
    savedLayouts,
    setIsEditMode,
    handleLayoutChange,
    toggleWidget,
    resetLayout,
    saveLayout,
    loadLayout,
    deleteLayout,
  } = useDashboardLayout({
    storageKey: 'kafkasder-dashboard-layout-v2',
  });

  const { renderWidget } = useDashboardWidgets({
    onToggleWidget: toggleWidget,
    isEditMode,
  });

  const { isConnected: isRealtimeConnected } = useDashboardRealtime({
    enabled: isAuthenticated,
    showNotifications: false,
  });

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="dashboard-root"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="dashboard-root"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-2xl bg-card border border-border shadow-xl"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <Activity className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-destructive">
            Kimlik Doğrulama Hatası
          </h2>
          <p className="text-muted-foreground mt-2">
            Lütfen tekrar giriş yapın.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-root" className="space-y-6 pb-8">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Hero Section */}
      <DashboardHeroSection
        userName={user?.name || 'Kullanıcı'}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Widget Grid Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <ErrorBoundary
          fallback={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {[1, 2, 3].map((i) => {
                const getWidgetTitle = (index: number): string => {
                  if (index === 1) return 'Dashboard Widget Hatası';
                  if (index === 2) return 'İstatistikler';
                  return 'Bildirimler';
                };

                const getWidgetDescription = (index: number): string => {
                  if (index === 1) return 'Widget sistemi geçici olarak kullanılamıyor. Lütfen sayfayı yenileyin.';
                  if (index === 2) return 'Yükleniyor...';
                  return 'Yeni bildirim yok';
                };

                return (
                  <div
                    key={i}
                    className="bg-card p-6 rounded-xl border border-border shadow-sm stagger-item"
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      {getWidgetTitle(i)}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {getWidgetDescription(i)}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          }
        >
          <Suspense
            fallback={
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <WidgetSkeleton key={i} type="stats" />
                ))}
              </div>
            }
          >
            <WidgetGrid
              widgets={widgets}
              visibleWidgets={visibleWidgets}
              layoutItems={layoutItems}
              isEditMode={isEditMode}
              savedLayouts={savedLayouts}
              onLayoutChange={handleLayoutChange}
              onToggleWidget={toggleWidget}
              onResetLayout={resetLayout}
              onSaveLayout={saveLayout}
              onLoadLayout={loadLayout}
              onDeleteLayout={deleteLayout}
              onEditModeChange={setIsEditMode}
              renderWidget={renderWidget}
              cols={12}
              rowHeight={40}
              margin={[8, 8]}
              className="mb-6"
            />
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    </div>
  );
}

export default memo(DashboardPageComponent);
