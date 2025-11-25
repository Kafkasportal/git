/**
 * API Cache Configuration
 *
 * This module provides comprehensive caching strategies for the application.
 * It defines cache durations, strategies, and utilities for different data types.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Cache duration constants (in milliseconds)
 */
export const CACHE_TIMES = {
  /** Very short cache for real-time data that changes frequently */
  REAL_TIME: 30 * 1000, // 30 seconds

  /** Short cache for frequently changing data */
  SHORT: 2 * 60 * 1000, // 2 minutes

  /** Standard cache for moderate data */
  STANDARD: 5 * 60 * 1000, // 5 minutes

  /** Medium cache for relatively stable data */
  MEDIUM: 10 * 60 * 1000, // 10 minutes

  /** Long cache for static or rarely changing data */
  LONG: 30 * 60 * 1000, // 30 minutes

  /** Very long cache for configuration or parameters */
  VERY_LONG: 60 * 60 * 1000, // 1 hour

  /** Auth session cache (while user is logged in) */
  SESSION: Infinity,
} as const;

/**
 * Garbage collection time - how long unused data stays in cache
 */
export const GC_TIMES = {
  /** Keep real-time data for 1 minute after last use */
  REAL_TIME: 1 * 60 * 1000,

  /** Keep short-lived data for 5 minutes after last use */
  SHORT: 5 * 60 * 1000,

  /** Keep standard data for 10 minutes after last use */
  STANDARD: 10 * 60 * 1000,

  /** Keep medium data for 30 minutes after last use */
  MEDIUM: 30 * 60 * 1000,

  /** Keep long-lived data for 1 hour after last use */
  LONG: 60 * 60 * 1000,

  /** Keep very long-lived data for 2 hours after last use */
  VERY_LONG: 2 * 60 * 60 * 1000,
} as const;

/**
 * Cache strategies for different data types
 */
export const CACHE_STRATEGIES = {
  /** Parameters, settings, and configuration */
  PARAMETERS: {
    staleTime: CACHE_TIMES.VERY_LONG,
    gcTime: GC_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /** User profiles and account data */
  USERS: {
    staleTime: CACHE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /** Current authenticated user */
  CURRENT_USER: {
    staleTime: CACHE_TIMES.SESSION,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /** Beneficiaries data */
  BENEFICIARIES: {
    staleTime: CACHE_TIMES.LONG, // Increased to LONG for better navigation performance
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Disabled for faster navigation
  },

  /** Donations data */
  DONATIONS: {
    staleTime: CACHE_TIMES.LONG, // Increased to LONG for better navigation performance
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Disabled for faster navigation
  },

  /** Aid requests */
  AID_REQUESTS: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: GC_TIMES.SHORT,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /** Scholarships */
  SCHOLARSHIPS: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: GC_TIMES.MEDIUM,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /** Tasks (frequently updated) */
  TASKS: {
    staleTime: CACHE_TIMES.REAL_TIME,
    gcTime: GC_TIMES.REAL_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /** Meetings */
  MEETINGS: {
    staleTime: CACHE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /** Meeting decisions */
  MEETING_DECISIONS: {
    staleTime: CACHE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /** Meeting action items */
  MEETING_ACTION_ITEMS: {
    staleTime: CACHE_TIMES.REAL_TIME,
    gcTime: GC_TIMES.REAL_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /** Workflow notifications */
  WORKFLOW_NOTIFICATIONS: {
    staleTime: CACHE_TIMES.REAL_TIME,
    gcTime: GC_TIMES.REAL_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /** Messages (real-time) */
  MESSAGES: {
    staleTime: CACHE_TIMES.REAL_TIME,
    gcTime: GC_TIMES.REAL_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /** Dashboard statistics */
  STATISTICS: {
    staleTime: CACHE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /** Reports (relatively static once generated) */
  REPORTS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /** Partners/Sponsors */
  PARTNERS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /** Analytics data */
  ANALYTICS: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: GC_TIMES.MEDIUM,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /** System settings */
  SETTINGS: {
    staleTime: CACHE_TIMES.VERY_LONG,
    gcTime: GC_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
} as const;

/**
 * Cache key prefixes for organized cache management
 */
export const CACHE_KEYS = {
  AUTH: 'auth',
  USERS: 'users',
  BENEFICIARIES: 'beneficiaries',
  DONATIONS: 'donations',
  AID_REQUESTS: 'aid-requests',
  AID_APPLICATIONS: 'aid-applications',
  SCHOLARSHIPS: 'scholarships',
  PARAMETERS: 'parameters',
  TASKS: 'tasks',
  MEETINGS: 'meetings',
  MEETING_DECISIONS: 'meeting-decisions',
  MEETING_ACTION_ITEMS: 'meeting-action-items',
  WORKFLOW_NOTIFICATIONS: 'workflow-notifications',
  MESSAGES: 'messages',
  STATISTICS: 'statistics',
  REPORTS: 'reports',
  PARTNERS: 'partners',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const;

/**
 * Helper function to invalidate related caches
 */
export function invalidateRelatedCaches(
  queryClient: QueryClient,
  entityType: keyof typeof CACHE_KEYS
) {
  const invalidations: string[][] = [];

  switch (entityType) {
    case 'BENEFICIARIES':
      // When beneficiaries change, invalidate statistics and related reports
      invalidations.push(
        [CACHE_KEYS.BENEFICIARIES],
        [CACHE_KEYS.STATISTICS],
        [CACHE_KEYS.AID_REQUESTS],
        [CACHE_KEYS.AID_APPLICATIONS]
      );
      break;

    case 'DONATIONS':
      // When donations change, invalidate statistics
      invalidations.push([CACHE_KEYS.DONATIONS], [CACHE_KEYS.STATISTICS]);
      break;

    case 'TASKS':
      // When tasks change, invalidate task-related caches
      invalidations.push([CACHE_KEYS.TASKS], [CACHE_KEYS.STATISTICS]);
      break;

    case 'MEETING_DECISIONS':
      invalidations.push(
        [CACHE_KEYS.MEETING_DECISIONS],
        [CACHE_KEYS.MEETING_ACTION_ITEMS],
        [CACHE_KEYS.MEETINGS]
      );
      break;

    case 'MEETING_ACTION_ITEMS':
      invalidations.push(
        [CACHE_KEYS.MEETING_ACTION_ITEMS],
        [CACHE_KEYS.MEETING_DECISIONS],
        [CACHE_KEYS.MEETINGS],
        [CACHE_KEYS.WORKFLOW_NOTIFICATIONS]
      );
      break;

    case 'WORKFLOW_NOTIFICATIONS':
      invalidations.push([CACHE_KEYS.WORKFLOW_NOTIFICATIONS]);
      break;

    case 'MEETINGS':
      // When meetings change, invalidate meeting caches
      invalidations.push([CACHE_KEYS.MEETINGS], [CACHE_KEYS.STATISTICS]);
      break;

    case 'USERS':
      // When users change, invalidate user-related caches
      invalidations.push([CACHE_KEYS.USERS], [CACHE_KEYS.STATISTICS]);
      break;

    default:
      // For other entities, just invalidate their own cache
      invalidations.push([CACHE_KEYS[entityType]]);
  }

  // Execute all invalidations
  invalidations.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

/**
 * Helper function to prefetch data
 */
export async function prefetchData(
  queryClient: QueryClient,
  queryKey: readonly string[],
  queryFn: () => Promise<unknown>,
  strategy: keyof typeof CACHE_STRATEGIES
): Promise<void> {
  const options = CACHE_STRATEGIES[strategy];

  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options.staleTime,
  });
}

/**
 * Create optimized QueryClient configuration
 */
export function createOptimizedQueryClient(): QueryClient {
  const isDev = process.env.NODE_ENV === 'development';

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default to longer caching in dev for faster navigation
        staleTime: isDev ? CACHE_TIMES.LONG : CACHE_TIMES.STANDARD,
        gcTime: isDev ? GC_TIMES.VERY_LONG : GC_TIMES.STANDARD,

        // Network optimization - reduce refetches in dev
        refetchOnWindowFocus: false,
        refetchOnReconnect: !isDev, // Disabled in dev for faster navigation
        refetchOnMount: !isDev, // Disabled in dev to use cache more aggressively

        // Background refetch - critical for performance
        refetchInterval: false, // Disabled by default, enable per-query if needed
        refetchIntervalInBackground: false,

        // Retry configuration with exponential backoff
        retry: isDev ? 1 : 2, // Less retries in dev
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network mode - 'online' by default, 'always' for critical data
        networkMode: 'online',

        // Error handling
        throwOnError: false,

        // Structural sharing for performance - reduces re-renders
        structuralSharing: true,

        // Enable parallel queries by default
        // React Query automatically deduplicates identical queries
        // and can run multiple queries in parallel
      },
      mutations: {
        // Retry mutations once on network errors
        retry: isDev ? 0 : 1, // No retries in dev
        retryDelay: 1000,

        // Network mode for mutations
        networkMode: 'online',

        // Optimistic updates for better UX
        // Individual mutations can enable optimistic updates as needed
      },
    },
  });
}

/**
 * Cache utility functions
 */
export const cacheUtils = {
  /**
   * Clear all caches
   */
  clearAll(queryClient: QueryClient) {
    queryClient.clear();
  },

  /**
   * Clear cache for specific entity type
   */
  clearEntityCache(queryClient: QueryClient, entityType: keyof typeof CACHE_KEYS) {
    queryClient.removeQueries({ queryKey: [CACHE_KEYS[entityType]] });
  },

  /**
   * Get cache statistics
   */
  getCacheStats(queryClient: QueryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      errorQueries: queries.filter((q) => q.state.status === 'error').length,
    };
  },

  /**
   * Warm up cache with essential data
   */
  async warmUpCache(
    queryClient: QueryClient,
    essentialDataFetchers: Array<{
      key: string[];
      fetcher: () => Promise<unknown>;
      strategy: keyof typeof CACHE_STRATEGIES;
    }>
  ) {
    await Promise.allSettled(
      essentialDataFetchers.map(({ key, fetcher, strategy }) =>
        prefetchData(queryClient, key, fetcher, strategy)
      )
    );
  },
};

/**
 * Get cache strategy for query key
 */
export function getCacheStrategy(
  queryKey: string[]
): (typeof CACHE_STRATEGIES)[keyof typeof CACHE_STRATEGIES] {
  const prefix = queryKey[0];

  switch (prefix) {
    case CACHE_KEYS.PARAMETERS:
      return CACHE_STRATEGIES.PARAMETERS;
    case CACHE_KEYS.USERS:
      return queryKey[1] === 'current' ? CACHE_STRATEGIES.CURRENT_USER : CACHE_STRATEGIES.USERS;
    case CACHE_KEYS.BENEFICIARIES:
      return CACHE_STRATEGIES.BENEFICIARIES;
    case CACHE_KEYS.DONATIONS:
      return CACHE_STRATEGIES.DONATIONS;
    case CACHE_KEYS.AID_REQUESTS:
    case CACHE_KEYS.AID_APPLICATIONS:
      return CACHE_STRATEGIES.AID_REQUESTS;
    case CACHE_KEYS.SCHOLARSHIPS:
      return CACHE_STRATEGIES.SCHOLARSHIPS;
    case CACHE_KEYS.TASKS:
      return CACHE_STRATEGIES.TASKS;
    case CACHE_KEYS.MEETINGS:
      return CACHE_STRATEGIES.MEETINGS;
    case CACHE_KEYS.MEETING_DECISIONS:
      return CACHE_STRATEGIES.MEETING_DECISIONS;
    case CACHE_KEYS.MEETING_ACTION_ITEMS:
      return CACHE_STRATEGIES.MEETING_ACTION_ITEMS;
    case CACHE_KEYS.WORKFLOW_NOTIFICATIONS:
      return CACHE_STRATEGIES.WORKFLOW_NOTIFICATIONS;
    case CACHE_KEYS.MESSAGES:
      return CACHE_STRATEGIES.MESSAGES;
    case CACHE_KEYS.STATISTICS:
      return CACHE_STRATEGIES.STATISTICS;
    case CACHE_KEYS.REPORTS:
      return CACHE_STRATEGIES.REPORTS;
    case CACHE_KEYS.PARTNERS:
      return CACHE_STRATEGIES.PARTNERS;
    case CACHE_KEYS.ANALYTICS:
      return CACHE_STRATEGIES.ANALYTICS;
    case CACHE_KEYS.SETTINGS:
      return CACHE_STRATEGIES.SETTINGS;
    default:
      // Return standard strategy as default
      return {
        staleTime: CACHE_TIMES.STANDARD,
        gcTime: GC_TIMES.STANDARD,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      };
  }
}
