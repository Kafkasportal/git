"use client";

import { useEffect, useState } from "react";
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

export function ReactQueryDevtoolsWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render in development and after client-side mount
  if (!isMounted || process.env.NODE_ENV !== "development") {
    return null;
  }

  return <ReactQueryDevtoolsDevelopment initialIsOpen={false} />;
}

