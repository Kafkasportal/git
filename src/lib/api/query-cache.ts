/**
 * API Query Cache and Optimization
 * Provides utilities for efficient API request caching and deduplication
 */

/**
 * Cache entry with TTL (time to live)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Query cache manager
 */
export class QueryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private pendingRequests = new Map<string, Promise<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Clean up expired entries periodically
    this.startCleanupInterval();
  }

  /**
   * Get cached data or execute query
   */
  async get<R>(key: string, queryFn: () => Promise<R>, ttl?: number): Promise<R> {
    // Check if data is in cache and still valid
    const cached = this.cache.get(key as any);
    if (cached && !this.isExpired(cached)) {
      return cached.data as unknown as R;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as any as Promise<R>;
    }

    // Execute query and cache result
    const request = queryFn()
      .then((data) => {
        this.set(key, data as any, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request as any);
    return request;
  }

  /**
   * Set cache entry
   */
  set(key: string, data: T, ttl = this.defaultTTL): void {
    // Implement simple LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cache entry without executing query
   */
  getSync(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    return null;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate multiple entries by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ key: string; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, entry.ttl - (now - entry.timestamp)),
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries,
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }
}

/**
 * Request deduplication manager
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Deduplicate request - returns same promise if request is in flight
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Return existing request if in flight
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Execute request
    const request = fn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Get pending request count
   */
  pendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * Request batch manager
 */
export class BatchRequestManager<T = unknown> {
  private batch: Array<{
    key: string;
    params: unknown;
  }> = [];

  private batchSize: number;
  private batchDelay: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private batchFn: (batch: Array<{ key: string; params: unknown }>) => Promise<Map<string, T>>;

  constructor(
    batchFn: (batch: Array<{ key: string; params: unknown }>) => Promise<Map<string, T>>,
    batchSize = 10,
    batchDelay = 100
  ) {
    this.batchFn = batchFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * Add request to batch
   */
  async add(key: string, params: unknown): Promise<T> {
    return new Promise((_resolve, reject) => {
      this.batch.push({ key, params });

      // Execute immediately if batch is full
      if (this.batch.length >= this.batchSize) {
        this.flush().catch(reject);
      } else {
        // Schedule flush if not already scheduled
        if (!this.timeoutId) {
          this.timeoutId = setTimeout(() => this.flush().catch(reject), this.batchDelay);
        }
      }

      // Create listener for this request
      const checkForResult = () => {
        // This would need to be implemented with proper request tracking
        setTimeout(checkForResult, 10);
      };

      checkForResult();
    });
  }

  /**
   * Flush batch immediately
   */
  private async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const batchToProcess = [...this.batch];
    this.batch = [];

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    await this.batchFn(batchToProcess);
  }

  /**
   * Get batch size
   */
  size(): number {
    return this.batch.length;
  }
}

/**
 * Create efficient API query configuration
 */
export function createQueryConfig(options?: {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number | false;
  retryDelay?: number;
}) {
  return {
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    cacheTime: options?.cacheTime ?? 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnReconnect: options?.refetchOnReconnect ?? true,
    retry: options?.retry ?? 3,
    retryDelay: options?.retryDelay ?? 1000,
  };
}

/**
 * Global cache instance
 */
const globalCache = new QueryCache();

/**
 * Get global cache instance
 */
export function getGlobalCache(): QueryCache {
  return globalCache;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCachePattern(pattern: RegExp): void {
  globalCache.invalidatePattern(pattern);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}
