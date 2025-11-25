/**
 * Custom hooks for API caching
 *
 * Provides convenient hooks that automatically apply the correct cache strategy
 * based on the data type being queried.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import logger from '@/lib/logger';
import {
  CACHE_KEYS,
  CACHE_STRATEGIES,
  getCacheStrategy,
  invalidateRelatedCaches,
} from '@/lib/cache-config';
import { persistentCache } from '@/lib/persistent-cache';
import { useEffect } from 'react';

/**
 * Hook for querying beneficiaries with optimized caching
 */
export function useBeneficiariesQuery<T = unknown>(
  params: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.BENEFICIARIES, params],
    ...CACHE_STRATEGIES.BENEFICIARIES,
    ...options,
  });
}

/**
 * Hook for querying a single beneficiary
 */
export function useBeneficiaryQuery<T = unknown>(
  id: string,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.BENEFICIARIES, id],
    ...CACHE_STRATEGIES.BENEFICIARIES,
    ...options,
  });
}

/**
 * Hook for querying donations with optimized caching
 */
export function useDonationsQuery<T = unknown>(
  params: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.DONATIONS, params],
    ...CACHE_STRATEGIES.DONATIONS,
    ...options,
  });
}

/**
 * Hook for querying tasks with real-time caching
 */
export function useTasksQuery<T = unknown>(
  params: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.TASKS, params],
    ...CACHE_STRATEGIES.TASKS,
    ...options,
  });
}

/**
 * Hook for querying meetings with optimized caching
 */
export function useMeetingsQuery<T = unknown>(
  params: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.MEETINGS, params],
    ...CACHE_STRATEGIES.MEETINGS,
    ...options,
  });
}

/**
 * Hook for querying messages with real-time caching
 */
export function useMessagesQuery<T = unknown>(
  params: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.MESSAGES, params],
    ...CACHE_STRATEGIES.MESSAGES,
    ...options,
  });
}

/**
 * Hook for querying parameters with long-term caching
 */
export function useParametersQuery<T = unknown>(
  type?: string,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: type ? [CACHE_KEYS.PARAMETERS, type] : [CACHE_KEYS.PARAMETERS],
    ...CACHE_STRATEGIES.PARAMETERS,
    ...options,
  });
}

/**
 * Hook for querying users with optimized caching
 */
export function useUsersQuery<T = unknown>(
  params: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.USERS, params],
    ...CACHE_STRATEGIES.USERS,
    ...options,
  });
}

/**
 * Hook for querying current user with session-long caching
 */
export function useCurrentUserQuery<T = unknown>(options?: Partial<UseQueryOptions<T>>) {
  return useQuery<T>({
    queryKey: [CACHE_KEYS.AUTH, 'current'],
    ...CACHE_STRATEGIES.CURRENT_USER,
    ...options,
  });
}

/**
 * Hook for querying statistics with optimized caching
 */
export function useStatisticsQuery<T = unknown>(
  params?: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: params ? [CACHE_KEYS.STATISTICS, params] : [CACHE_KEYS.STATISTICS],
    ...CACHE_STRATEGIES.STATISTICS,
    ...options,
  });
}

/**
 * Generic cached query hook with automatic strategy selection
 */
export function useCachedQuery<T = unknown>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>
) {
  const strategy = getCacheStrategy(queryKey);

  return useQuery<T>({
    queryKey,
    queryFn,
    ...strategy,
    ...options,
  });
}

/**
 * Hook for mutations with automatic cache invalidation
 */
export function useCachedMutation<
  TData = unknown,
  TError = Error,
  TVariables = unknown,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  entityType: keyof typeof CACHE_KEYS,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    mutationFn,
    onSuccess: (data, variables, context, mutationContext) => {
      // Invalidate related caches
      invalidateRelatedCaches(queryClient, entityType);

      // Call user's onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, mutationContext);
      }
    },
  });
}

/**
 * Hook to prefetch data with persistent cache
 */
export function usePrefetchWithCache<T = unknown>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  enabled = true
) {
  const queryClient = useQueryClient();
  const strategy = getCacheStrategy(queryKey);

  useEffect(() => {
    if (!enabled) return;

    const prefetch = async () => {
      // Check persistent cache first
      const cacheKey = queryKey.join(':');
      const cached = await persistentCache.get<T>(cacheKey);

      if (cached) {
        // Set in React Query cache
        queryClient.setQueryData(queryKey, cached);
      } else {
        // Prefetch if not in cache
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => {
            const data = await queryFn();
            // Store in persistent cache
            await persistentCache.set(cacheKey, data, strategy.staleTime);
            return data;
          },
          staleTime: strategy.staleTime,
        });
      }
    };

    prefetch().catch((error) => logger.error('Prefetch failed', { error, queryKey }));
  }, [queryKey, queryFn, enabled, queryClient, strategy.staleTime]);
}

/**
 * Hook to manage cache metrics and debugging
 */
export function useCacheMetrics() {
  const queryClient = useQueryClient();

  return {
    /**
     * Get React Query cache statistics
     */
    getQueryCacheStats: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      return {
        totalQueries: queries.length,
        activeQueries: queries.filter((q) => q.state.fetchStatus === 'fetching').length,
        staleQueries: queries.filter((q) => q.isStale()).length,
        errorQueries: queries.filter((q) => q.state.status === 'error').length,
        successQueries: queries.filter((q) => q.state.status === 'success').length,
      };
    },

    /**
     * Get persistent cache metrics
     */
    getPersistentCacheMetrics: () => persistentCache.getMetrics(),

    /**
     * Get cache size information
     */
    getCacheSize: async () => await persistentCache.getSize(),

    /**
     * Clear all caches
     */
    clearAllCaches: async () => {
      queryClient.clear();
      await persistentCache.clear();
    },

    /**
     * Clear specific entity cache
     */
    clearEntityCache: async (entityType: keyof typeof CACHE_KEYS) => {
      queryClient.removeQueries({ queryKey: [CACHE_KEYS[entityType]] });
      // Note: Persistent cache doesn't have entity-level clearing
    },

    /**
     * Cleanup expired entries
     */
    cleanup: async () => await persistentCache.cleanup(),

    /**
     * Export cache data
     */
    exportCache: async () => await persistentCache.export(),
  };
}

/**
 * Hook to warm up cache on app initialization
 */
export function useWarmUpCache(
  essentialDataFetchers: Array<{
    key: string[];
    fetcher: () => Promise<unknown>;
  }>,
  enabled = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const warmUp = async () => {
      if (process.env.NODE_ENV === 'development') {
        // Warm up message removed to reduce console noise
      }

      const results = await Promise.allSettled(
        essentialDataFetchers.map(async ({ key, fetcher }) => {
          const cacheKey = key.join(':');

          // Check persistent cache first
          const cached = await persistentCache.get(cacheKey);

          if (cached) {
            queryClient.setQueryData(key, cached);
            return { key, source: 'cache' };
          } else {
            // Fetch and cache
            const data = await fetcher();
            const strategy = getCacheStrategy(key);
            await persistentCache.set(cacheKey, data, strategy.staleTime);
            queryClient.setQueryData(key, data);
            return { key, source: 'fetch' };
          }
        })
      );

      if (process.env.NODE_ENV === 'development') {
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        // Success count logged in dev mode
        void successful; // Avoid unused var warning
      }
    };

    warmUp().catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Cache warm-up error', { error });
      }
    });
  }, [enabled, queryClient, essentialDataFetchers]); // Include all dependencies
}
