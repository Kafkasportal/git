/**
 * Advanced API Middleware
 * Additional middleware for caching, compression, security headers, and request timing
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import type { RouteHandler } from './middleware';

// ========================================
// CACHING MIDDLEWARE
// ========================================

export interface CacheOptions {
  /** Time to live in seconds */
  ttl: number;
  /** Cache key prefix */
  prefix?: string;
  /** Whether to cache based on query params */
  varyByQuery?: boolean;
  /** Specific query params to vary by */
  varyByParams?: string[];
  /** Cache control header value */
  cacheControl?: string;
  /** Stale-while-revalidate time in seconds */
  swr?: number;
}

// Simple in-memory cache for demonstration
// In production, use Redis or similar
const responseCache = new Map<string, { data: string; headers: Headers; expires: number }>();

function getCacheKey(request: NextRequest, options: CacheOptions): string {
  const url = new URL(request.url);
  let key = options.prefix || '';
  key += url.pathname;
  
  if (options.varyByQuery) {
    if (options.varyByParams?.length) {
      const params = options.varyByParams
        .map((p) => `${p}=${url.searchParams.get(p) || ''}`)
        .join('&');
      key += `?${params}`;
    } else {
      key += url.search;
    }
  }
  
  return key;
}

export function withCache(options: CacheOptions) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      // Only cache GET requests
      if (request.method !== 'GET') {
        return handler(request, context);
      }
      
      const cacheKey = getCacheKey(request, options);
      const now = Date.now();
      
      // Check cache
      const cached = responseCache.get(cacheKey);
      if (cached && cached.expires > now) {
        const response = new NextResponse(cached.data, {
          status: 200,
          headers: cached.headers,
        });
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
      
      // Execute handler
      const response = await handler(request, context);
      
      // Cache successful responses
      if (response.status === 200) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.text();
        const headers = new Headers(response.headers);
        
        responseCache.set(cacheKey, {
          data,
          headers,
          expires: now + options.ttl * 1000,
        });
        
        // Set cache control headers
        const cacheControl = options.cacheControl ||
          `public, max-age=${options.ttl}${options.swr ? `, stale-while-revalidate=${options.swr}` : ''}`;
        response.headers.set('Cache-Control', cacheControl);
        response.headers.set('X-Cache', 'MISS');
      }
      
      return response;
    };
  };
}

/**
 * Clear cache entries matching a pattern
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}

// ========================================
// SECURITY HEADERS MIDDLEWARE
// ========================================

export interface SecurityHeadersOptions {
  /** Content Security Policy */
  csp?: string;
  /** Enable HSTS */
  hsts?: boolean;
  /** HSTS max age in seconds */
  hstsMaxAge?: number;
  /** X-Frame-Options value */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  /** X-Content-Type-Options */
  noSniff?: boolean;
  /** Referrer-Policy value */
  referrerPolicy?: string;
  /** Permissions-Policy value */
  permissionsPolicy?: string;
}

const defaultSecurityOptions: SecurityHeadersOptions = {
  hsts: true,
  hstsMaxAge: 31536000, // 1 year
  frameOptions: 'DENY',
  noSniff: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
};

export function withSecurityHeaders(options: SecurityHeadersOptions = {}) {
  const opts = { ...defaultSecurityOptions, ...options };
  
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const response = await handler(request, context);
      
      // HSTS
      if (opts.hsts) {
        response.headers.set(
          'Strict-Transport-Security',
          `max-age=${opts.hstsMaxAge}; includeSubDomains`
        );
      }
      
      // X-Frame-Options
      if (opts.frameOptions) {
        response.headers.set('X-Frame-Options', opts.frameOptions);
      }
      
      // X-Content-Type-Options
      if (opts.noSniff) {
        response.headers.set('X-Content-Type-Options', 'nosniff');
      }
      
      // Referrer-Policy
      if (opts.referrerPolicy) {
        response.headers.set('Referrer-Policy', opts.referrerPolicy);
      }
      
      // Content-Security-Policy
      if (opts.csp) {
        response.headers.set('Content-Security-Policy', opts.csp);
      }
      
      // Permissions-Policy
      if (opts.permissionsPolicy) {
        response.headers.set('Permissions-Policy', opts.permissionsPolicy);
      }
      
      // X-XSS-Protection (legacy but still useful)
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;
    };
  };
}

// ========================================
// REQUEST TIMING MIDDLEWARE
// ========================================

export interface TimingOptions {
  /** Header name for server timing */
  headerName?: string;
  /** Whether to include in response headers */
  includeHeaders?: boolean;
  /** Slow request threshold in ms */
  slowThreshold?: number;
}

export function withTiming(options: TimingOptions = {}) {
  const {
    headerName = 'Server-Timing',
    includeHeaders = true,
    slowThreshold = 1000,
  } = options;
  
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      const response = await handler(request, context);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;
      
      // Log slow requests
      if (duration > slowThreshold) {
        logger.warn('Slow request detected', {
          url: request.url,
          method: request.method,
          durationMs: `${duration.toFixed(2)}ms`,
          memoryDeltaMb: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        });
      }
      
      // Add timing header
      if (includeHeaders) {
        // Server-Timing format: name;dur=X;desc="Y"
        // Memory delta as a separate metric with duration in bytes/1000 for readability
        const memoryKb = Math.round(memoryDelta / 1024);
        response.headers.set(
          headerName,
          `total;dur=${duration.toFixed(2)};desc="Total request time", memory;dur=${memoryKb};desc="Heap delta KB"`
        );
        response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
      }
      
      return response;
    };
  };
}

// ========================================
// COMPRESSION MIDDLEWARE
// ========================================

export interface CompressionOptions {
  /** Minimum size to compress (bytes) */
  threshold?: number;
  /** Content types to compress */
  types?: string[];
}

export function withCompression(options: CompressionOptions = {}) {
  const {
    threshold: _threshold = 1024,
    types = ['application/json', 'text/html', 'text/plain', 'text/css', 'application/javascript'],
  } = options;
  
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const response = await handler(request, context);
      
      const contentType = response.headers.get('Content-Type') || '';
      const shouldCompress = types.some((t) => contentType.includes(t));
      
      if (!shouldCompress) {
        return response;
      }
      
      const acceptEncoding = request.headers.get('Accept-Encoding') || '';
      
      // Check if client supports compression
      // Note: Actual compression would need to be done at the edge/CDN level
      // This is more for indicating compression support
      if (acceptEncoding.includes('gzip') || acceptEncoding.includes('br')) {
        response.headers.set('Vary', 'Accept-Encoding');
      }
      
      return response;
    };
  };
}

// ========================================
// REQUEST ID MIDDLEWARE
// ========================================

export function withRequestId(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const requestId = request.headers.get('X-Request-ID') ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const response = await handler(request, context);
    response.headers.set('X-Request-ID', requestId);
    
    return response;
  };
}

// ========================================
// ETAG MIDDLEWARE
// ========================================

export function withETag(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const response = await handler(request, context);
    
    if (request.method !== 'GET' || response.status !== 200) {
      return response;
    }
    
    // Clone and read body to generate ETag
    const clonedResponse = response.clone();
    const body = await clonedResponse.text();
    
    // Simple hash for ETag (in production use crypto.subtle.digest)
    const hash = simpleHash(body);
    const etag = `"${hash}"`;
    
    // Check If-None-Match
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }
    
    response.headers.set('ETag', etag);
    return response;
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ========================================
// RETRY MIDDLEWARE
// ========================================

export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Initial delay in ms */
  initialDelay?: number;
  /** Max delay in ms */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffFactor?: number;
  /** Status codes to retry */
  retryableStatuses?: number[];
}

export function withRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffFactor = 2,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
  } = options;
  
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      let lastError: Error | null = null;
      let delay = initialDelay;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await handler(request, context);
          
          if (!retryableStatuses.includes(response.status)) {
            return response;
          }
          
          // If retryable status and not last attempt, wait and retry
          if (attempt < maxRetries) {
            await sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
            continue;
          }
          
          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries) {
            logger.warn(`Request failed, retrying (attempt ${attempt + 1}/${maxRetries})`, {
              error: lastError.message,
            });
            await sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
          }
        }
      }
      
      throw lastError;
    };
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================================
// REQUEST BODY SIZE LIMIT MIDDLEWARE
// ========================================

export interface BodyLimitOptions {
  /** Maximum body size in bytes */
  maxSize?: number;
}

export function withBodyLimit(options: BodyLimitOptions = {}) {
  const { maxSize = 10 * 1024 * 1024 } = options; // Default 10MB
  
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const contentLength = request.headers.get('Content-Length');
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        return NextResponse.json(
          { error: 'İstek gövdesi çok büyük', maxSize: `${maxSize / 1024 / 1024}MB` },
          { status: 413 }
        );
      }
      
      return handler(request, context);
    };
  };
}

// ========================================
// IP WHITELIST/BLACKLIST MIDDLEWARE
// ========================================

export interface IpFilterOptions {
  whitelist?: string[];
  blacklist?: string[];
  behindProxy?: boolean;
}

export function withIpFilter(options: IpFilterOptions) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      let clientIp = request.headers.get('x-real-ip') || 'unknown';
      
      if (options.behindProxy) {
        const forwardedFor = request.headers.get('x-forwarded-for');
        if (forwardedFor) {
          clientIp = forwardedFor.split(',')[0].trim();
        }
      }
      
      // Check blacklist first
      if (options.blacklist?.includes(clientIp)) {
        logger.warn('Blocked IP attempted access', { ip: clientIp });
        return NextResponse.json(
          { error: 'Erişim reddedildi' },
          { status: 403 }
        );
      }
      
      // Check whitelist if defined
      if (options.whitelist?.length && !options.whitelist.includes(clientIp)) {
        logger.warn('Non-whitelisted IP attempted access', { ip: clientIp });
        return NextResponse.json(
          { error: 'Erişim reddedildi' },
          { status: 403 }
        );
      }
      
      return handler(request, context);
    };
  };
}

// ========================================
// IDEMPOTENCY MIDDLEWARE
// ========================================

const idempotencyStore = new Map<string, { response: string; headers: Headers; status: number; expires: number }>();

export interface IdempotencyOptions {
  /** TTL for idempotency keys in seconds */
  ttl?: number;
  /** Header name for idempotency key */
  headerName?: string;
}

export function withIdempotency(options: IdempotencyOptions = {}) {
  const { ttl = 86400, headerName = 'Idempotency-Key' } = options; // Default 24 hours
  
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      // Only for mutating requests
      if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
        return handler(request, context);
      }
      
      const idempotencyKey = request.headers.get(headerName);
      if (!idempotencyKey) {
        return handler(request, context);
      }
      
      const now = Date.now();
      
      // Check for existing response
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached && cached.expires > now) {
        const response = new NextResponse(cached.response, {
          status: cached.status,
          headers: cached.headers,
        });
        response.headers.set('X-Idempotent-Replayed', 'true');
        return response;
      }
      
      // Execute handler
      const response = await handler(request, context);
      
      // Store response for replay
      const clonedResponse = response.clone();
      const responseBody = await clonedResponse.text();
      
      idempotencyStore.set(idempotencyKey, {
        response: responseBody,
        headers: new Headers(response.headers),
        status: response.status,
        expires: now + ttl * 1000,
      });
      
      return response;
    };
  };
}

// ========================================
// EXPORT COMPOSED MIDDLEWARE
// ========================================

export interface AdvancedMiddlewareOptions {
  cache?: CacheOptions;
  security?: SecurityHeadersOptions;
  timing?: TimingOptions;
  compression?: CompressionOptions;
  requestId?: boolean;
  etag?: boolean;
  retry?: RetryOptions;
  bodyLimit?: BodyLimitOptions;
  ipFilter?: IpFilterOptions;
  idempotency?: IdempotencyOptions;
}

/**
 * Apply multiple advanced middleware at once
 */
export function withAdvancedMiddleware(options: AdvancedMiddlewareOptions) {
  return (handler: RouteHandler): RouteHandler => {
    let wrappedHandler = handler;
    
    // Apply in order of execution
    if (options.requestId) {
      wrappedHandler = withRequestId(wrappedHandler);
    }
    
    if (options.timing) {
      wrappedHandler = withTiming(options.timing)(wrappedHandler);
    }
    
    if (options.security) {
      wrappedHandler = withSecurityHeaders(options.security)(wrappedHandler);
    }
    
    if (options.ipFilter) {
      wrappedHandler = withIpFilter(options.ipFilter)(wrappedHandler);
    }
    
    if (options.bodyLimit) {
      wrappedHandler = withBodyLimit(options.bodyLimit)(wrappedHandler);
    }
    
    if (options.idempotency) {
      wrappedHandler = withIdempotency(options.idempotency)(wrappedHandler);
    }
    
    if (options.retry) {
      wrappedHandler = withRetry(options.retry)(wrappedHandler);
    }
    
    if (options.cache) {
      wrappedHandler = withCache(options.cache)(wrappedHandler);
    }
    
    if (options.etag) {
      wrappedHandler = withETag(wrappedHandler);
    }
    
    if (options.compression) {
      wrappedHandler = withCompression(options.compression)(wrappedHandler);
    }
    
    return wrappedHandler;
  };
}
