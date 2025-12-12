"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useMediaQuery Hook
 *
 * A hook for responsive design that listens to CSS media query changes.
 * Uses window.matchMedia for efficient, native media query detection.
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * const isPortrait = useMediaQuery('(orientation: portrait)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with server-safe default
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  const handleChange = useCallback((event: MediaQueryListEvent) => {
    setMatches(event.matches);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value - use flushSync to avoid cascading renders
    import('react-dom').then(({ flushSync }) => {
      flushSync(() => setMatches(mediaQuery.matches));
    });

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy browsers (Safari < 14)
    else {
      // Legacy API for older browsers
      (mediaQuery as unknown).addListener(handleChange);
      return () => (mediaQuery as unknown).removeListener(handleChange);
    }
  }, [query, handleChange]);

  return matches;
}

/**
 * Predefined breakpoint hooks for convenience
 */

// Mobile first breakpoints (matches Tailwind defaults)
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () =>
  useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const useIsLargeDesktop = () => useMediaQuery("(min-width: 1280px)");

// Min-width breakpoints (matches Tailwind sm, md, lg, xl, 2xl)
export const useBreakpointSm = () => useMediaQuery("(min-width: 640px)");
export const useBreakpointMd = () => useMediaQuery("(min-width: 768px)");
export const useBreakpointLg = () => useMediaQuery("(min-width: 1024px)");
export const useBreakpointXl = () => useMediaQuery("(min-width: 1280px)");
export const useBreakpoint2xl = () => useMediaQuery("(min-width: 1536px)");

// User preference hooks
export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");
export const usePrefersDarkMode = () =>
  useMediaQuery("(prefers-color-scheme: dark)");
export const usePrefersLightMode = () =>
  useMediaQuery("(prefers-color-scheme: light)");
export const usePrefersHighContrast = () =>
  useMediaQuery("(prefers-contrast: high)");

// Orientation hooks
export const useIsPortrait = () => useMediaQuery("(orientation: portrait)");
export const useIsLandscape = () => useMediaQuery("(orientation: landscape)");

// Interaction hooks
export const useHasHover = () => useMediaQuery("(hover: hover)");
export const useHasPointer = () => useMediaQuery("(pointer: fine)");
export const useIsTouchDevice = () => useMediaQuery("(pointer: coarse)");

export default useMediaQuery;
