'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { createOptimizedQueryClient, cacheUtils } from '@/lib/cache-config';
import { persistentCache } from '@/lib/persistent-cache';
import { initGlobalErrorHandlers } from '@/lib/global-error-handler';
import { initErrorTracker } from '@/lib/error-tracker';
import { SettingsProvider } from '@/contexts/settings-context';

import { SuspenseBoundary } from '@/components/ui/suspense-boundary';

// TypeScript interfaces for window objects
interface WindowWithDebug extends Window {
  __AUTH_STORE__?: typeof useAuthStore;
  __QUERY_CLIENT__?: QueryClient;
  __CACHE__?: typeof persistentCache;
  __CACHE_UTILS__?: typeof cacheUtils;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createOptimizedQueryClient());

  const [mounted] = useState(true);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const initializeAuth = useAuthStore((state) => state?.initializeAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  // Initialize debug utilities (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose to window for manual debugging (safe)
      if (typeof window !== 'undefined') {
        const windowWithDebug = window as WindowWithDebug;
        windowWithDebug.__AUTH_STORE__ = useAuthStore;
        windowWithDebug.__QUERY_CLIENT__ = queryClient;
        windowWithDebug.__CACHE__ = persistentCache;
        windowWithDebug.__CACHE_UTILS__ = cacheUtils;
      }
    }
  }, [queryClient]);

  // Initialize error tracking system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize global error handlers
      initGlobalErrorHandlers();

      // Initialize error tracker (retry pending errors)
      initErrorTracker();

      // Error tracking system initialized
    }
  }, []);

  // Periodic cache cleanup
  useEffect(() => {
    // Clean up expired cache entries every 5 minutes
    const cleanupInterval = setInterval(
      async () => {
        const cleaned = await persistentCache.cleanup();
        if (cleaned > 0 && process.env.NODE_ENV === 'development') {
          // Cleanup logged by persistent cache
        }
      },
      5 * 60 * 1000
    );

    return () => clearInterval(cleanupInterval);
  }, []);

  // Wait for Zustand persist hydration to finish and update store flag
  useEffect(() => {
    const markHydrated = () => {
      setHydrated(true);
    };

    // Always mark as hydrated immediately in development to avoid white screen
    // The store will handle the actual hydration internally
    markHydrated();
  }, [setHydrated]);

  // Wait for both mounted and hydration complete before initializing auth
  useEffect(() => {
    if (mounted && hasHydrated && initializeAuth) {
      // Initialize auth when ready
      initializeAuth();
    }
  }, [mounted, hasHydrated, initializeAuth]);

  // Removed hydration check - let the app render immediately
  // The store will handle hydration internally

  // Render with Appwrite
  return (
    <QueryClientProvider client={queryClient}>
      <SuspenseBoundary
        loadingVariant="pulse"
        fullscreen={true}
        loadingText="Uygulama yükleniyor..."
        onSuspend={() => {
          // Suspended state
        }}
        onResume={() => {
          // Resumed state
        }}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </SuspenseBoundary>
      <Toaster position="top-right" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
