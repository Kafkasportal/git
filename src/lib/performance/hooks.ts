/**
 * Performance optimization hooks
 * Provides utilities for memoization, debouncing, throttling, and lazy loading
 */

import { useCallback, useEffect, useRef, useState, useMemo, DependencyList } from 'react';
import logger from '@/lib/logger';

/**
 * Debounced callback hook
 * Delays function execution until specified time has passed without invocation
 */
export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;
}

/**
 * Throttled callback hook
 * Limits function execution to once every specified time period
 */
export function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  ) as T;
}

/**
 * Debounced value hook
 * Returns debounced version of a value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled value hook
 * Returns throttled version of a value
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingValueRef = useRef<T>(value);

  useEffect(() => {
    pendingValueRef.current = value;

    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= delay) {
      // Schedule state update to avoid cascading renders
      Promise.resolve().then(() => {
        setThrottledValue(pendingValueRef.current);
        lastRunRef.current = Date.now();
      });
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(pendingValueRef.current);
        lastRunRef.current = Date.now();
      }, delay - timeSinceLastRun);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Intersection observer hook for lazy loading
 * Tracks visibility of element
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isVisible;
}

/**
 * Lazy memoization hook
 * Memoizes value based on dependencies
 * Note: This is a wrapper around useMemo for semantic clarity
 */
export function useLazyMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(), deps);
}

/**
 * Lazy callback with cleanup
 * Cleanup function runs on unmount or dependency change
 */
export function useEffectAsync(
  effect: () => Promise<void> | (() => void),
  deps?: DependencyList
): void {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cleanup = await effect();
      if (!cancelled && typeof cleanup === 'function') {
        cleanup();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, deps);
}

/**
 * Request animation frame hook
 * Syncs updates with browser repaint
 */
export function useAnimationFrame(callback: (deltaTime: number) => void): void {
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Initialize lastTime on mount
    lastTimeRef.current = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTimeRef.current;

      callbackRef.current(deltaTime);
      lastTimeRef.current = currentTime;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
}

/**
 * Media query hook
 * Tracks whether media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Local storage hook
 * Syncs state with localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error reading localStorage key "${key}"`, error as Error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        logger.error(`Error setting localStorage key "${key}"`, error as Error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Session storage hook
 * Syncs state with sessionStorage
 */
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error reading sessionStorage key "${key}"`, error as Error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        logger.error(`Error setting sessionStorage key "${key}"`, error as Error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Previous value hook
 * Returns previous value from previous render
 */
export function usePrevious<T>(value: T): T | undefined {
  const [prev, setPrev] = useState<T | undefined>(undefined);
  const valueRef = useRef<T>(value);

  useEffect(() => {
    setPrev(valueRef.current);
    valueRef.current = value;
  }, [value]);

  return prev;
}

/**
 * Mount status hook
 * Tracks if component is mounted
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Use Promise to defer state update
    Promise.resolve().then(() => setIsMounted(true));
    return () => {
      setIsMounted(false);
    };
  }, []);

  return isMounted;
}

/**
 * Async state hook
 * Manages loading, error, and data states for async operations
 */
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
): {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: E | null;
  execute: () => Promise<void>;
} {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const result = await asyncFunction();
      if (mountedRef.current) {
        setData(result);
        setStatus('success');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as E);
        setStatus('error');
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    mountedRef.current = true;

    if (immediate) {
      // Defer execute to avoid cascading renders
      Promise.resolve().then(() => {
        if (mountedRef.current) {
          void execute();
        }
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [execute, immediate]);

  return { status, data, error, execute };
}

/**
 * Copy to clipboard hook
 * Copies text to clipboard
 */
export function useCopyToClipboard(): {
  isCopied: boolean;
  copy: (text: string) => Promise<boolean>;
} {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      logger.error('Clipboard API not available');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      return true;
    } catch (error) {
      logger.error('Failed to copy', error as Error);
      return false;
    }
  }, []);

  return { isCopied, copy };
}
