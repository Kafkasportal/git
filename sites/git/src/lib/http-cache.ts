/**
 * HTTP Cache Headers Utilities
 *
 * Provides utilities for setting appropriate HTTP cache headers on API responses.
 * This enables browser and CDN caching for improved performance.
 */

import { NextResponse } from 'next/server';
import { CACHE_TIMES } from './cache-config';

export type CacheControl = 'no-cache' | 'no-store' | 'private' | 'public' | 'immutable';

export interface CacheHeadersOptions {
  /** Cache duration in milliseconds */
  maxAge?: number;
  /** Stale-while-revalidate duration in milliseconds */
  swr?: number;
  /** Cache control directives */
  cacheControl?: CacheControl[];
  /** Enable ETag generation */
  etag?: boolean;
  /** Custom headers */
  customHeaders?: Record<string, string>;
}

/**
 * Convert milliseconds to seconds for HTTP headers
 */
function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * Generate cache control header value
 */
function generateCacheControl(options: CacheHeadersOptions): string {
  const directives: string[] = [];

  // Add cache control directives
  if (options.cacheControl) {
    directives.push(...options.cacheControl);
  }

  // Add max-age
  if (options.maxAge !== undefined) {
    directives.push(`max-age=${msToSeconds(options.maxAge)}`);
  }

  // Add stale-while-revalidate
  if (options.swr !== undefined) {
    directives.push(`stale-while-revalidate=${msToSeconds(options.swr)}`);
  }

  return directives.join(', ');
}

/**
 * Generate ETag from data
 */
function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Add cache headers to a Response
 */
export function addCacheHeaders(
  response: Response | NextResponse,
  options: CacheHeadersOptions
): Response | NextResponse {
  const cacheControl = generateCacheControl(options);

  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }

  // Add custom headers
  if (options.customHeaders) {
    Object.entries(options.customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Create a cached response with appropriate headers
 */
export function createCachedResponse(
  data: unknown,
  options: CacheHeadersOptions & {
    status?: number;
    statusText?: string;
  } = {}
): NextResponse {
  const { status = 200, statusText, ...cacheOptions } = options;

  const response = NextResponse.json(data, { status, statusText });

  // Add ETag if requested
  if (cacheOptions.etag) {
    const etag = generateETag(data);
    response.headers.set('ETag', etag);
  }

  return addCacheHeaders(response, cacheOptions) as NextResponse;
}

/**
 * Check if request has matching ETag
 */
export function hasMatchingETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match');
  return ifNoneMatch === etag;
}

/**
 * Create a 304 Not Modified response
 */
export function createNotModifiedResponse(etag: string): NextResponse {
  const response = new NextResponse(null, { status: 304 });
  response.headers.set('ETag', etag);
  return response;
}

/**
 * Predefined cache configurations for common scenarios
 */
export const CACHE_CONFIGS = {
  /** No caching - for sensitive or user-specific data */
  NO_CACHE: {
    cacheControl: ['no-store', 'private'] as CacheControl[],
  },

  /** Private cache - for user-specific data that can be cached locally */
  PRIVATE: {
    cacheControl: ['private'] as CacheControl[],
    maxAge: CACHE_TIMES.SHORT,
  },

  /** Public short cache - for data that changes frequently */
  PUBLIC_SHORT: {
    cacheControl: ['public'] as CacheControl[],
    maxAge: CACHE_TIMES.SHORT,
    swr: CACHE_TIMES.SHORT,
    etag: true,
  },

  /** Public standard cache - for moderately changing data */
  PUBLIC_STANDARD: {
    cacheControl: ['public'] as CacheControl[],
    maxAge: CACHE_TIMES.STANDARD,
    swr: CACHE_TIMES.STANDARD,
    etag: true,
  },

  /** Public long cache - for rarely changing data */
  PUBLIC_LONG: {
    cacheControl: ['public'] as CacheControl[],
    maxAge: CACHE_TIMES.LONG,
    swr: CACHE_TIMES.LONG,
    etag: true,
  },

  /** Immutable cache - for static resources that never change */
  IMMUTABLE: {
    cacheControl: ['public', 'immutable'] as CacheControl[],
    maxAge: CACHE_TIMES.VERY_LONG,
  },

  /** Revalidate cache - must revalidate but can serve stale */
  REVALIDATE: {
    cacheControl: ['public', 'no-cache'] as CacheControl[],
    swr: CACHE_TIMES.SHORT,
    etag: true,
  },
} as const;

/**
 * Middleware helper for API routes to add cache headers based on route pattern
 */
export function getCacheConfigForRoute(pathname: string): CacheHeadersOptions {
  // Auth endpoints - no caching
  if (pathname.includes('/api/auth')) {
    return CACHE_CONFIGS.NO_CACHE;
  }

  // CSRF tokens - no caching
  if (pathname.includes('/api/csrf')) {
    return CACHE_CONFIGS.NO_CACHE;
  }

  // Health check - short cache
  if (pathname.includes('/api/health')) {
    return CACHE_CONFIGS.PUBLIC_SHORT;
  }

  // Parameters - long cache
  if (pathname.includes('/api/parameters')) {
    return CACHE_CONFIGS.PUBLIC_LONG;
  }

  // Statistics - standard cache
  if (pathname.includes('/api/statistics')) {
    return CACHE_CONFIGS.PUBLIC_STANDARD;
  }

  // Reports - long cache
  if (pathname.includes('/api/reports')) {
    return CACHE_CONFIGS.PUBLIC_LONG;
  }

  // Beneficiaries, donations - short cache
  if (
    pathname.includes('/api/beneficiaries') ||
    pathname.includes('/api/donations') ||
    pathname.includes('/api/aid-requests')
  ) {
    return CACHE_CONFIGS.PUBLIC_SHORT;
  }

  // Tasks, messages - real-time (no cache or very short)
  if (pathname.includes('/api/tasks') || pathname.includes('/api/messages')) {
    return CACHE_CONFIGS.REVALIDATE;
  }

  // Default: private cache for user-specific data
  return CACHE_CONFIGS.PRIVATE;
}

/**
 * Example usage in API route:
 *
 * export async function GET(request: Request) {
 *   const data = await fetchData();
 *
 *   // Option 1: Use predefined config
 *   return createCachedResponse(data, CACHE_CONFIGS.PUBLIC_STANDARD);
 *
 *   // Option 2: Use automatic config based on route
 *   const cacheConfig = getCacheConfigForRoute(request.url);
 *   return createCachedResponse(data, cacheConfig);
 *
 *   // Option 3: Custom config
 *   return createCachedResponse(data, {
 *     cacheControl: ['public'],
 *     maxAge: 5 * 60 * 1000,
 *     etag: true,
 *   });
 * }
 */
