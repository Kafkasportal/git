/**
 * Dashboard-specific Error Fallback
 * Used for dashboard pages with charts and analytics
 */

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardErrorProps {
  error?: Error;
  resetError?: () => void;
}

export function DashboardError({ error, resetError }: DashboardErrorProps) {
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <CardTitle className="text-xl">Dashboard Yüklenemedi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Dashboard verileri yüklenirken bir hata oluştu. Bu genellikle geçici bir sorundur.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 border border-red-200 dark:border-red-900/30">
              <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {resetError && (
              <Button onClick={resetError} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Yeniden Yükle
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/genel')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200 dark:border-blue-900/30">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>İpucu:</strong> Sayfayı yenilemek genellikle sorunu çözer. Sorun devam ederse
              önbelleği temizleyip tekrar deneyin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
