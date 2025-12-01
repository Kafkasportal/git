"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { createOptimizedQueryClient, cacheUtils } from "@/lib/cache-config";
import { persistentCache } from "@/lib/persistent-cache";
import { initGlobalErrorHandlers } from "@/lib/global-error-handler";
import { initErrorTracker } from "@/lib/error-tracker";
import { initializeSentry, setSentryUser, clearSentryUser } from "@/lib/sentry";
import { SettingsProvider } from "@/contexts/settings-context";
import { KeyboardNavigationProvider } from "@/contexts/keyboard-navigation-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { pingAppwrite } from "@/lib/appwrite";
import logger from "@/lib/logger";

import { SuspenseBoundary } from "@/components/ui/suspense-boundary";
import { ReactQueryDevtoolsWrapper } from "@/components/devtools/ReactQueryDevtools";

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
    if (process.env.NODE_ENV === "development") {
      // Expose to window for manual debugging (safe)
      if (typeof window !== "undefined") {
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
    if (typeof window !== "undefined") {
      // Initialize Sentry for error tracking
      initializeSentry();

      // Initialize global error handlers
      initGlobalErrorHandlers();

      // Initialize error tracker (retry pending errors)
      initErrorTracker();

      // Error tracking system initialized
    }
  }, []);

  // Ping Appwrite to verify connection on app load
  useEffect(() => {
    if (typeof window !== "undefined") {
      pingAppwrite().then((success) => {
        if (!success) {
          logger.warn("⚠️ Appwrite connection could not be verified");
        }
      });
    }
  }, []);

  // Periodic cache cleanup - optimized for better performance
  useEffect(() => {
    // Clean up expired cache entries every 10 minutes (increased from 5 for better performance)
    const cleanupInterval = setInterval(
      async () => {
        try {
          const cleaned = await persistentCache.cleanup();
          if (cleaned > 0 && process.env.NODE_ENV === "development") {
            // Cleanup logged by persistent cache
          }
        } catch (error) {
          // Silently handle cleanup errors to prevent memory leaks
          if (process.env.NODE_ENV === "development") {
            logger.warn("Cache cleanup error", { error: error instanceof Error ? error.message : String(error) });
          }
        }
      },
      10 * 60 * 1000, // Increased from 5 minutes to 10 minutes
    );

    return () => {
      clearInterval(cleanupInterval);
    };
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
        <ThemeProvider defaultTheme="system" storageKey="theme" enableSystem>
          <KeyboardNavigationProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </KeyboardNavigationProvider>
        </ThemeProvider>
      </SuspenseBoundary>
      <Toaster position="top-right" richColors />
      <ReactQueryDevtoolsWrapper />
    </QueryClientProvider>
  );
}
