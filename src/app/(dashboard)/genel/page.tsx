'use client';

import { memo, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PageLayout } from '@/components/layouts/PageLayout';
import { DemoBanner } from '@/components/ui/demo-banner';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardWidgets } from '@/components/dashboard/dashboard-widgets';
import WidgetGrid from '@/components/dashboard/widget-grid';
import { WidgetSkeleton } from '@/components/ui/skeleton-variants';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';

function DashboardPageComponent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Dashboard layout hook
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

  // Dashboard widgets hook
  const { renderWidget } = useDashboardWidgets({
    onToggleWidget: toggleWidget,
    isEditMode,
  });

  // Realtime updates hook - auto-refreshes dashboard data
  const { isConnected: isRealtimeConnected } = useDashboardRealtime({
    enabled: isAuthenticated,
    showNotifications: false, // Disable toast spam, data updates silently
  });

  // Show loading if still loading auth
  if (authLoading) {
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

  return (
    <div data-testid="dashboard-root">
      <PageLayout
        title={`Hoş geldiniz, ${user?.name || 'Kullanıcı'}!`}
        description="Sistemin genel durumunu buradan takip edebilirsiniz"
        badge={{
          text: isRealtimeConnected ? '● Canlı' : 'Sistem Aktif',
          variant: isRealtimeConnected ? 'default' : 'secondary'
        }}
      >
        {/* Demo Mode Banner */}
        <DemoBanner />

        {/* Widget Grid with Drag & Drop - Wrapped in ErrorBoundary for resilience */}
        <ErrorBoundary
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Dashboard Widget Hatası</h3>
                <p className="text-muted-foreground text-sm">Widget sistemi geçici olarak kullanılamıyor. Lütfen sayfayı yenileyin.</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">İstatistikler</h3>
                <p className="text-muted-foreground text-sm">Yükleniyor...</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Bildirimler</h3>
                <p className="text-muted-foreground text-sm">Yeni bildirim yok</p>
              </div>
            </div>
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
              margin={[6, 6]}
              className="mb-6"
            />
          </Suspense>
        </ErrorBoundary>
      </PageLayout>
    </div>
  );
}

// Memoized version for performance optimization
export default memo(DashboardPageComponent);
