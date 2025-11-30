"use client";

import { useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

// Only load DevTools in development and client-side
const ReactQueryDevtoolsDevelopment = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((d) => ({
      default: d.ReactQueryDevtools,
    })),
  { 
    ssr: false,
    loading: () => null,
  }
);

// Simple client-side check without useState
function useIsMounted() {
  const mountedRef = useRef(false);
  
  // Use useSyncExternalStore to track mount state without triggering warnings
  return useSyncExternalStore(
    (callback) => {
      // Subscribe - set mounted on first call
      if (!mountedRef.current) {
        mountedRef.current = true;
        // Schedule callback for next tick
        const id = setTimeout(callback, 0);
        return () => clearTimeout(id);
      }
      return () => {};
    },
    () => mountedRef.current, // getSnapshot for client
    () => false // getServerSnapshot
  );
}

export function ReactQueryDevtoolsWrapper() {
  const isMounted = useIsMounted();

  // Only render in development and after client-side mount
  if (!isMounted || process.env.NODE_ENV !== "development") {
    return null;
  }

  return <ReactQueryDevtoolsDevelopment initialIsOpen={false} />;
}
