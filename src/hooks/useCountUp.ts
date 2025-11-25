/**
 * useCountUp Hook
 * Animates a number from 0 to target value
 * Used for metric cards with animated counters
 */

import { useEffect, useState, useRef } from 'react';

export interface UseCountUpOptions {
  /** Start value (default: 0) */
  start?: number;
  /** End value */
  end: number;
  /** Duration in milliseconds (default: 2000) */
  duration?: number;
  /** Decimal places (default: 0) */
  decimals?: number;
  /** Enable animation (default: true) */
  enabled?: boolean;
  /** Easing function (default: easeOutExpo) */
  easing?: (t: number) => number;
}

/**
 * Easing functions
 */
const easingFunctions = {
  // Exponential easing out
  easeOutExpo: (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  },
  // Linear
  linear: (t: number): number => t,
  // Ease in-out
  easeInOutQuad: (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
};

/**
 * Custom hook for animated counter
 */
export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  enabled = true,
  easing = easingFunctions.easeOutExpo,
}: UseCountUpOptions) {
  // Initialize with correct value based on enabled state
  const [count, setCount] = useState(() => (enabled ? start : end));
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // If animation disabled, show end value directly
    if (!enabled) {
      return;
    }

    // Reset refs
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      // Initialize start time
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easedProgress = easing(progress);

      // Calculate current count
      const currentCount = start + (end - start) * easedProgress;

      setCount(currentCount);

      // Continue animation if not complete
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end on exact value
        setCount(end);
        startTimeRef.current = null;
      }
    };

    // Start animation
    frameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, enabled, start, easing]);

  // Update count immediately when animation is disabled
  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Needed to sync disabled state with end value
      setCount(end);
    }
  }, [enabled, end]);

  // Format the count
  const formattedCount = decimals > 0 ? count.toFixed(decimals) : Math.round(count);

  return {
    count: formattedCount,
    rawCount: count,
  };
}

/**
 * Format number with locale
 */
export function formatNumber(
  value: number,
  options?: {
    locale?: string;
    decimals?: number;
    notation?: 'standard' | 'compact' | 'scientific' | 'engineering';
  }
): string {
  const { locale = 'tr-TR', decimals = 0, notation = 'standard' } = options || {};

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation,
  }).format(value);
}
