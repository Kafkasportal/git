'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import logger from '@/lib/logger';

/**
 * Error component for Next.js App Router
 * Catches errors in route segments
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [resetCount, setResetCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Log error to logger in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Route error context', {
        error,
        digest: error.digest,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        type: 'route-error',
      });

      // Check for browser extensions
      const hasExtensions =
        document.documentElement.getAttribute('cz-shortcut-listen') ||
        document.documentElement.getAttribute('data-gr-ext') ||
        document.documentElement.getAttribute('data-loom-ext');
      if (hasExtensions) {
        logger.warn('Browser extensions detected - may cause hydration issues', {
          extensions: hasExtensions,
        });
      }
    }

    // Send error to Sentry
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as Window & {
        Sentry?: {
          captureException: (error: Error, options?: { tags?: Record<string, string> }) => void;
        };
      };
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error, {
          tags: { digest: error.digest, type: 'route-error' },
        });
      }
    }

    // Add error tracking to window (development only)
    if (process.env.NODE_ENV === 'development') {
      const windowWithError = window as Window & {
        __LAST_ERROR__?: { error: Error; digest?: string; timestamp: Date };
      };
      windowWithError.__LAST_ERROR__ = { error, digest: error.digest, timestamp: new Date() };
    }
  }, [error]);

  const isHydrationError =
    error.message.toLowerCase().includes('hydration') ||
    error.message.toLowerCase().includes('mismatch') ||
    error.message.toLowerCase().includes('text content does not match');

  // Add error type detection
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isStoreError = error.message.includes('store') || error.message.includes('zustand');

  // Add test mode indicator
  const isTestError = error.stack?.includes('test-error-boundary');

  const copyErrorDetails = () => {
    const details = JSON.stringify(
      {
        error: error.message,
        stack: error.stack,
        digest: error.digest,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    void navigator.clipboard.writeText(details);
    alert('Hata detayları kopyalandı');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isHydrationError ? 'Hydration Hatası' : 'Bir Hata Oluştu'}
          </h1>
          <p className="text-gray-600">
            {isHydrationError
              ? 'Bu bir hydration hatası. Tarayıcı önbelleğini temizleyip tekrar deneyin.'
              : 'Üzgünüz, sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'}
          </p>
          {isNetworkError && (
            <p className="text-sm text-blue-600">Ağ bağlantınızı kontrol edin ve tekrar deneyin.</p>
          )}
          {isStoreError && (
            <p className="text-sm text-purple-600">Uygulama durumu hatası. Sayfayı yenileyin.</p>
          )}
          {isTestError && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              🧪 Test Mode
            </div>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 rounded-md bg-gray-100 p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-gray-700">
              Hata Detayları (Sadece Development)
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <strong>Error:</strong>
                <pre className="mt-1 overflow-auto text-xs text-red-600">{error.message}</pre>
              </div>
              {error.digest && (
                <div>
                  <strong>Digest:</strong>
                  <pre className="mt-1 overflow-auto text-xs text-gray-600">{error.digest}</pre>
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 overflow-auto text-xs text-gray-600">{error.stack}</pre>
                </div>
              )}
              <div>
                <strong>Reset Count:</strong> {resetCount}
              </div>
            </div>
          </details>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              setResetCount((c) => c + 1);
              reset();
            }}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
          <Button onClick={() => router.push('/genel')} className="w-full" variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
          {isHydrationError && (
            <Button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full"
              variant="destructive"
            >
              🗑️ Clear Storage & Reload
            </Button>
          )}
          {process.env.NODE_ENV === 'development' && (
            <Button onClick={copyErrorDetails} className="w-full" variant="secondary">
              📋 Copy Error Details
            </Button>
          )}
          {isTestError && (
            <Button
              onClick={() => router.push('/test-error-boundary')}
              className="w-full"
              variant="outline"
            >
              🔙 Back to Test Page
            </Button>
          )}
        </div>

        {error.digest && (
          <p className="text-center text-xs text-gray-500">Hata Kodu: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
