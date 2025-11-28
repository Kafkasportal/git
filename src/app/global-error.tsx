'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

interface PerformanceMemory {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
}

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: Record<string, unknown>) => void;
      showReportDialog?: () => void;
    };
    __GLOBAL_ERROR__?: {
      error: Error & { digest?: string };
      digest?: string;
      timestamp: Date;
    };
    performance?: {
      memory?: PerformanceMemory;
    };
  }
}

/**
 * Global Error component for Next.js App Router
 * Catches errors in root layout (most critical errors)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error with context
    logger.error('Critical application error', {
      error,
      digest: error.digest,
      userAgent: navigator.userAgent,
      url: window.location.href,
      type: 'global-error',
    });

    // Check for unsupported browsers
    const isUnsupportedBrowser = /MSIE|Trident/.test(navigator.userAgent);
    if (isUnsupportedBrowser) {
      logger.warn('Unsupported browser detected', { userAgent: navigator.userAgent });
    }

    // Check if it's a hydration error
    const isHydrationError =
      error.message.toLowerCase().includes('hydration') ||
      error.message.toLowerCase().includes('mismatch');

    if (isHydrationError) {
      logger.error('Hydration error detected', { error, digest: error.digest });
    }

    // Send to Sentry with high priority
    if (typeof window !== 'undefined') {
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          level: 'fatal',
          tags: { digest: error.digest, type: 'global-error' },
          contexts: {
            browser: {
              userAgent: navigator.userAgent,
              screen: `${window.screen.width}x${window.screen.height}`,
            },
            memory: {
              used: window.performance.memory?.usedJSHeapSize,
              total: window.performance.memory?.totalJSHeapSize,
            },
          },
          user: {
            ip_address: '{{auto}}',
          },
        });

        // Add user feedback mechanism if Sentry feedback widget available
        if (window.Sentry.showReportDialog) {
          window.Sentry.showReportDialog();
        }
      }

      // Add error tracking to window (development only)
      if (process.env.NODE_ENV === 'development') {
        window.__GLOBAL_ERROR__ = { error, digest: error.digest, timestamp: new Date() };
      }
    }
  }, [error]);

  const isHydrationError =
    error.message.toLowerCase().includes('hydration') ||
    error.message.toLowerCase().includes('mismatch'); // Browser check for global scope
  const isUnsupportedBrowser =
    typeof window !== 'undefined' && /MSIE|Trident/.test(navigator.userAgent);

  // Add error type specific recovery
  const isNetworkError =
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('connection');
  const isStoreError =
    error.message.toLowerCase().includes('store') ||
    error.message.toLowerCase().includes('zustand') ||
    error.message.toLowerCase().includes('state');

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  borderRadius: '9999px',
                  marginBottom: '1rem',
                }}
              >
                <svg
                  style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '0.5rem',
                }}
              >
                Kritik Bir Hata Oluştu
              </h1>
              <p
                style={{
                  color: '#6b7280',
                  marginBottom: '1.5rem',
                }}
              >
                Uygulama beklenmedik bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
              </p>
              {isUnsupportedBrowser && (
                <div
                  style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#92400e',
                      margin: 0,
                    }}
                  >
                    ⚠️ Bu tarayıcı desteklenmiyor. Lütfen Chrome, Firefox, Safari veya Edge
                    kullanın.
                  </p>
                </div>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Hata Detayları (Development)
                </summary>
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Error:</strong>
                  <pre
                    style={{
                      marginTop: '0.25rem',
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      color: '#dc2626',
                    }}
                  >
                    {error.message}
                  </pre>
                  {error.digest && (
                    <>
                      <strong>Digest:</strong>
                      <pre
                        style={{
                          marginTop: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#6b7280',
                        }}
                      >
                        {error.digest}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.replace('/')}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                Ana Sayfaya Dön
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    const errorReport = {
                      message: error.message,
                      stack: error.stack,
                      digest: error.digest,
                      userAgent: navigator.userAgent,
                      url: window.location.href,
                      timestamp: new Date().toISOString(),
                      localStorage: { ...localStorage },
                    };
                    const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `error-report-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d97706')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f59e0b')}
                >
                  📥 Download Error Report
                </button>
              )}
              {isHydrationError && (
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.replace('/');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                >
                  🗑️ Clear Storage & Reload
                </button>
              )}
              {isNetworkError && (
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#0891b2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0e7490')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0891b2')}
                >
                  🔄 Check Connection & Retry
                </button>
              )}
              {isStoreError && (
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6d28d9')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
                >
                  🔧 Reset Application State
                </button>
              )}
            </div>

            {(isHydrationError || isStoreError) && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  marginTop: '1rem',
                  fontWeight: '600',
                }}
              >
                ⚠️ Bu işlem tüm yerel verileri silecek
              </p>
            )}

            <p
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '1.5rem',
              }}
            >
              Sorun devam ederse lütfen sistem yöneticisi ile iletişime geçin.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
