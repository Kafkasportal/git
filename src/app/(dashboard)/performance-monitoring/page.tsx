'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PerformanceMonitor,
  usePerformanceMonitor,
  useFPSMonitor,
  perfLog,
} from '@/lib/performance-monitor';
import {
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Clock,
  Cpu,
  HardDrive,
} from 'lucide-react';

export default function PerformanceMonitoringPage() {
  const [routeMetrics, setRouteMetrics] = useState<any>({});
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { getMetrics } = usePerformanceMonitor('performance-dashboard');
  const { getFPS, isGoodPerformance } = useFPSMonitor(isMonitoring);

  // Get memory usage directly from performance API
  const getMemoryUsage = () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  };

  // Real-time monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const fps = getFPS();
      const memory = getMemoryUsage();
      const metrics = getMetrics();

      setRouteMetrics({
        fps,
        memory,
        performance: metrics,
        timestamp: new Date().toISOString(),
      });
      setLastUpdate(new Date());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isMonitoring, getFPS, getMetrics]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    perfLog.info(`Performance monitoring ${!isMonitoring ? 'started' : 'stopped'}`);
  };

  const getPerformanceStatus = () => {
    const fps = routeMetrics.fps || 60;
    const memory = routeMetrics.memory;

    if (fps >= 55 && (!memory || memory < 50 * 1024 * 1024)) {
      return { status: 'good', color: 'bg-green-500', label: 'İyi' };
    } else if (fps >= 30) {
      return { status: 'warning', color: 'bg-yellow-500', label: 'Orta' };
    } else {
      return { status: 'poor', color: 'bg-red-500', label: 'Zayıf' };
    }
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Performance Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem performansını gerçek zamanlı takip edin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={performanceStatus.status === 'good' ? 'default' : 'destructive'}>
            {performanceStatus.label}
          </Badge>
          <Button onClick={toggleMonitoring} variant="outline" size="sm">
            {isMonitoring ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Duraklat
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Başlat
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Performance Monitor Component */}
      <PerformanceMonitor
        enableWebVitals={isMonitoring}
        enableCustomMetrics={isMonitoring}
        onMetrics={(metrics) => {
          if (process.env.NODE_ENV === 'development') {
            logger.info('Performance metrics', { metrics });
          }
        }}
        routeName="performance-dashboard"
      />

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* FPS Monitor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              FPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{routeMetrics.fps || 60}</div>
              <div className="flex items-center gap-1">
                {isGoodPerformance() ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isGoodPerformance() ? 'İyi performans' : 'Düşük performans'}
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Bellek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routeMetrics.memory ? `${Math.round(routeMetrics.memory / 1024 / 1024)}MB` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kullanılan JS Heap</p>
          </CardContent>
        </Card>

        {/* Route Transition Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Route Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routeMetrics.performance?.routeTransitionTime
                ? `${Math.round(routeMetrics.performance.routeTransitionTime)}ms`
                : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sayfa geçiş süresi</p>
          </CardContent>
        </Card>

        {/* Modal Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Modal Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routeMetrics.performance?.modalOpenTime
                ? `${Math.round(routeMetrics.performance.modalOpenTime)}ms`
                : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Modal açılış süresi</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Web Vitals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Web Vitals
            </CardTitle>
            <CardDescription>Core Web Vitals metrikleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
              <Badge variant="outline">
                {routeMetrics.performance?.lcp
                  ? `${Math.round(routeMetrics.performance.lcp)}ms`
                  : 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">FID (First Input Delay)</span>
              <Badge variant="outline">
                {routeMetrics.performance?.fid
                  ? `${Math.round(routeMetrics.performance.fid)}ms`
                  : 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
              <Badge variant="outline">
                {routeMetrics.performance?.cls ? routeMetrics.performance.cls.toFixed(3) : 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sistem Bilgileri
            </CardTitle>
            <CardDescription>Çalışma zamanı sistem bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monitoring Durumu</span>
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Son Güncelleme</span>
              <span className="text-sm text-muted-foreground">
                {lastUpdate.toLocaleTimeString('tr-TR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Environment</span>
              <Badge variant="outline">{process.env.NODE_ENV || 'development'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance İpuçları</CardTitle>
          <CardDescription>Uygulama performansını optimize etmek için öneriler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Metrik Hedefleri</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• FPS: 55+ (İyi), 30-54 (Orta), &lt; 30 (Zayıf)</li>
                <li>• LCP: &lt; 2.5s (İyi), 2.5-4s (Orta), &gt; 4s (Zayıf)</li>
                <li>• FID: &lt; 100ms (İyi), 100-300ms (Orta), &gt; 300ms (Zayıf)</li>
                <li>• CLS: &lt; 0.1 (İyi), 0.1-0.25 (Orta), &gt; 0.25 (Zayıf)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Optimizasyon Önerileri</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Component&apos;ları React.memo ile optimize edin</li>
                <li>• useMemo ve useCallback kullanın</li>
                <li>• Lazy loading ile bundle boyutunu azaltın</li>
                <li>• Image optimization yapın</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
