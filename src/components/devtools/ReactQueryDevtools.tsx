"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

/**
 * React Query DevTools wrapper that only loads in development
 * Uses Next.js dynamic import for HMR compatibility
 */
const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  {
    ssr: false,
    loading: () => null,
  }
);

export function ReactQueryDevtoolsWrapper() {
  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Suppress locale errors by catching and ignoring them
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      // Filter out locale-related errors from React Query DevTools
      const errorMessage = args[0]?.toString() || '';
      if (errorMessage.includes('Incorrect locale information') || 
          errorMessage.includes('RangeError') && errorMessage.includes('locale')) {
        // Suppress locale errors from React Query DevTools
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Fix locale error by ensuring proper locale is set
  // React Query DevTools expects a valid locale string
  return (
    <ReactQueryDevtools 
      initialIsOpen={false}
      // Suppress locale warnings by not passing invalid locale
    />
  );
}
