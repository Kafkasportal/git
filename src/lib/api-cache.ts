// Advanced API Response Caching System
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import logger from '@/lib/logger';

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
  staleWhileRevalidate: boolean; // Serve stale data while revalidating
  gcInterval: number; // Garbage collection interval
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface APIResponseCache<T> {
  get: (key: string) => T | null;
  set: (key: string, data: T, ttl?: number) => void;
  delete: (key: string) => void;
  clear: () => void;
  size: () => number;
  getStats: () => { hits: number; misses: number; hitRate: number };
}

class SmartCache<T> implements APIResponseCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  private gcTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startGarbageCollection();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  set(key: string, data: T, ttl?: number): void {
    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.config.ttl),
      accessCount: 1,
      lastAccessed: now,
    };

    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.garbageCollect();
    }, this.config.gcInterval);
  }

  private garbageCollect(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  destroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
  }
}

// Cache configurations for different data types
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  beneficiaries: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    staleWhileRevalidate: true,
    gcInterval: 2 * 60 * 1000, // 2 minutes
  },
  donations: {
    ttl: 3 * 60 * 1000, // 3 minutes
    maxSize: 50,
    staleWhileRevalidate: true,
    gcInterval: 2 * 60 * 1000,
  },
  tasks: {
    ttl: 2 * 60 * 1000, // 2 minutes
    maxSize: 75,
    staleWhileRevalidate: true,
    gcInterval: 1 * 60 * 1000, // 1 minute
  },
  meetings: {
    ttl: 1 * 60 * 1000, // 1 minute
    maxSize: 30,
    staleWhileRevalidate: false,
    gcInterval: 1 * 60 * 1000,
  },
  default: {
    ttl: 2 * 60 * 1000, // 2 minutes
    maxSize: 50,
    staleWhileRevalidate: true,
    gcInterval: 2 * 60 * 1000,
  },
};

// Global cache instances
const cacheInstances = new Map<string, SmartCache<any>>();

function getCache<T>(dataType: string): SmartCache<T> {
  if (!cacheInstances.has(dataType)) {
    const config = CACHE_CONFIGS[dataType] || CACHE_CONFIGS.default;
    cacheInstances.set(dataType, new SmartCache<T>(config));
  }
  return cacheInstances.get(dataType) as SmartCache<T>;
}

// Cache key generator
function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}:${paramString}`;
}

// Enhanced useQuery with caching
export function useCachedQuery<T>({
  endpoint,
  params,
  dataType = 'default',
  enabled = true,
  staleTime = 2 * 60 * 1000, // 2 minutes
  gcTime = 10 * 60 * 1000, // 10 minutes
  ...queryOptions
}: {
  endpoint: string;
  params?: Record<string, any>;
  dataType?: string;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
} & Parameters<typeof useQuery<T>>[0]) {
  const cache = getCache<T>(dataType);
  const cacheKey = generateCacheKey(endpoint, params);

  const query = useQuery<T>({
    ...queryOptions,
    queryKey: [endpoint, params],
    queryFn: async () => {
      // Check cache first
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch fresh data
      const response = await fetch(
        `${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ''}`
      );
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      cache.set(cacheKey, data);

      return data;
    },
    enabled,
    staleTime,
    gcTime,
  });

  return query;
}

// Prefetch with smart caching
export function usePrefetchWithCache() {
  const queryClient = useQueryClient();
  const prefetchControllers = useRef(new Map<string, AbortController>());

  const prefetch = useCallback(
    async <T>({
      endpoint,
      params,
      dataType = 'default',
      priority = 'low', // 'low' | 'normal' | 'high'
    }: {
      endpoint: string;
      params?: Record<string, any>;
      dataType?: string;
      priority?: 'low' | 'normal' | 'high';
    }) => {
      const cacheKey = generateCacheKey(endpoint, params);
      const cache = getCache<T>(dataType);

      // Skip if already cached and fresh
      if (cache.get(cacheKey)) {
        return;
      }

      // Cancel previous prefetch if exists
      const controller = prefetchControllers.current.get(cacheKey);
      if (controller) {
        controller.abort();
      }

      // Create new controller
      const newController = new AbortController();
      prefetchControllers.current.set(cacheKey, newController);

      try {
        const url = `${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ''}`;
        const init: RequestInit = { signal: newController.signal };

        // Safely attempt to set fetch priority if the environment supports it
        try {
          // Some browsers throw when unknown init fields are provided; probe support first
          // Using Request constructor to detect support without sending a network request
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Request(url, { priority: priority as any });
          // If we reach here, assign priority to init for fetch
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (init as any).priority = priority;
        } catch {
          // Ignore unsupported priority; proceed without it
        }

        const response = await fetch(url, init);

        if (!response.ok) {
          throw new Error(`Prefetch Error: ${response.status}`);
        }

        const data = await response.json();
        cache.set(cacheKey, data);

        // Update React Query cache
        queryClient.setQueryData([endpoint, params], data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError' && process.env.NODE_ENV === 'development') {
          logger.warn('Prefetch failed', { error });
        }
      } finally {
        prefetchControllers.current.delete(cacheKey);
      }
    },
    [queryClient]
  );

  const clearPrefetch = useCallback((endpoint: string, params?: Record<string, any>) => {
    const cacheKey = generateCacheKey(endpoint, params);
    const controller = prefetchControllers.current.get(cacheKey);
    if (controller) {
      controller.abort();
      prefetchControllers.current.delete(cacheKey);
    }
  }, []);

  return { prefetch, clearPrefetch };
}

// Cache statistics hook
export function useCacheStats() {
  const getCacheStats = useCallback(() => {
    const stats: Record<string, any> = {};

    for (const [dataType, cache] of cacheInstances.entries()) {
      stats[dataType] = {
        size: cache.size(),
        ...cache.getStats(),
      };
    }

    return stats;
  }, []);

  return { getCacheStats };
}

// Cache invalidation hook
export function useInvalidateCache() {
  const queryClient = useQueryClient();

  const invalidateEndpoint = useCallback(
    (endpoint: string, dataType?: string) => {
      // Clear cache
      if (dataType) {
        const cache = getCache(dataType);
        cache.clear();
      } else {
        // Clear all caches
        for (const cache of cacheInstances.values()) {
          cache.clear();
        }
      }

      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    [queryClient]
  );

  const invalidatePattern = useCallback(
    (pattern: string) => {
      // Clear matching caches
      for (const [dataType, cache] of cacheInstances.entries()) {
        if (dataType.includes(pattern)) {
          cache.clear();
        }
      }

      // Invalidate matching queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return typeof firstKey === 'string' && firstKey.includes(pattern);
        },
      });
    },
    [queryClient]
  );

  return { invalidateEndpoint, invalidatePattern };
}

// Export cache utilities
export { getCache, generateCacheKey, SmartCache };
export type { APIResponseCache, CacheConfig };
