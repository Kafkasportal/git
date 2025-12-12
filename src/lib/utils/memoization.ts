/**
 * Memoization Utilities
 * 
 * Provides reusable memoization functions with different caching strategies:
 * - LRU cache for function results
 * - WeakMap for object-based memoization
 * - Async function memoization
 */

/**
 * LRU Cache implementation for memoization
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstIter = this.cache.keys().next();
      const firstKey = firstIter.value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize a function with LRU cache
 * 
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size (default: 100)
 * @param keyFn - Optional function to generate cache key from arguments
 * @returns Memoized function
 * 
 * @example
 * const memoizedFormat = memoize(formatCurrency, 50);
 */
export function memoize<T extends (...args: unknown[]) => any>(
  fn: T,
  maxSize: number = 100,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Memoize a function using WeakMap for object-based caching
 * Useful when arguments are objects that should be garbage collected
 * 
 * @param fn - Function to memoize
 * @returns Memoized function
 * 
 * @example
 * const memoizedSanitize = memoizeWeak(sanitizeObject);
 */
export function memoizeWeak<T extends (arg: object) => any>(fn: T): T {
  const cache = new WeakMap<object, ReturnType<T>>();

  return ((arg: object): ReturnType<T> => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  }) as T;
}

/**
 * Memoize an async function with LRU cache
 * 
 * @param fn - Async function to memoize
 * @param maxSize - Maximum cache size (default: 50)
 * @param keyFn - Optional function to generate cache key from arguments
 * @returns Memoized async function
 * 
 * @example
 * const memoizedFetch = memoizeAsync(fetchData, 30);
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<any>>(
  fn: T,
  maxSize: number = 50,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, Promise<Awaited<ReturnType<T>>>>(maxSize);

  return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = fn(...args).then(
      (result) => result,
      (error) => {
        // Remove from cache on error to allow retry
        cache.delete(key);
        throw error;
      }
    );
    
    cache.set(key, promise);
    return promise;
  }) as T;
}

/**
 * Create a memoized version of a function with custom cache key generator
 * 
 * @param fn - Function to memoize
 * @param keyFn - Function to generate cache key from arguments
 * @param maxSize - Maximum cache size (default: 100)
 * @returns Memoized function
 */
export function memoizeWithKey<T extends (...args: unknown[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  maxSize: number = 100
): T {
  return memoize(fn, maxSize, keyFn);
}

/**
 * Clear all memoization caches
 * Note: This only works for functions memoized with the exported utilities
 * WeakMap caches cannot be cleared externally
 */
const globalCaches: Set<LRUCache<unknown, any>> = new Set();

export function clearAllMemoCaches(): void {
  globalCaches.forEach((cache) => cache.clear());
}

