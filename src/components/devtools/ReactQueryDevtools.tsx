"use client";

import dynamic from "next/dynamic";

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

  return <ReactQueryDevtools initialIsOpen={false} />;
}
