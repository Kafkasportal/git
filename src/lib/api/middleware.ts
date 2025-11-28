/**
 * API Route Middleware Factory
 * Standardizes error handling, auth, validation, and logging across all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireModuleAccess } from '@/lib/api/auth-utils';
import { errorResponse } from '@/lib/api/route-helpers';

export type RouteHandler = (
  request: NextRequest,
  params?: Record<string, string>
) => Promise<NextResponse<any>>;

export interface MiddlewareOptions {
  requireAuth?: boolean;
  requireModule?: string;
  allowedMethods?: string[];
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: RouteHandler) => RouteHandler>) {
  return (handler: RouteHandler) => {
    return middlewares.reduce((wrapped, middleware) => middleware(wrapped), handler);
  };
}

/**
 * Authentication middleware
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request, params) => {
    try {
      // Session validation is done in requireModuleAccess
      // This is a placeholder for additional auth checks if needed
      return await handler(request, params);
    } catch (error) {
      logger.error('Auth middleware error', error);
      return errorResponse('Kimlik doğrulama başarısız', 401);
    }
  };
}

/**
 * Module access middleware
 */
export function withModuleAccess(moduleName: string) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, params) => {
      try {
        await requireModuleAccess(moduleName);
        return await handler(request, params);
      } catch (error) {
        logger.error(`Module access denied for ${moduleName}`, error);
        return errorResponse('Bu modüle erişim izniniz yok', 403);
      }
    };
  };
}

/**
 * Offline sync middleware
 * Handles X-Force-Overwrite header for conflict resolution
 */
export function withOfflineSync(handler: RouteHandler): RouteHandler {
  return async (request, params) => {
    const forceOverwrite = request.headers.get('X-Force-Overwrite') === 'true';

    if (forceOverwrite) {
      logger.info('Offline sync operation with force overwrite', {
        method: request.method,
        url: request.url,
      });
    }

    return await handler(request, params);
  };
}

/**
 * Error handling middleware
 * Enhanced with offline sync conflict resolution
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, params) => {
    try {
      return await handler(request, params);
    } catch (error) {
      const context = {
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString(),
      };

      // Handle duplicate key errors
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (
        errorMsg?.toLowerCase().includes('duplicate') ||
        errorMsg?.toLowerCase().includes('unique')
      ) {
        logger.error('Duplicate entry error', error, context);
        return errorResponse('Bu kayıt zaten mevcut', 409);
      }

      // Handle validation errors
      if (errorMsg?.toLowerCase().includes('validation')) {
        logger.error('Validation error', error, context);
        return errorResponse('Doğrulama hatası', 400);
      }

      // Handle not found
      if (errorMsg?.toLowerCase().includes('not found')) {
        logger.error('Not found error', error, context);
        return errorResponse('Kayıt bulunamadı', 404);
      }

      // Generic server error
      logger.error('API error', error, context);
      return errorResponse('İşlem başarısız oldu', 500);
    }
  };
}

/**
 * Request validation middleware
 */
export interface ValidatorOptions {
  requireBody?: boolean;
  maxBodySize?: number;
}

export function withValidation(options: ValidatorOptions = {}) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, params) => {
      try {
        if (options.requireBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          if (!request.body) {
            return errorResponse('İstek gövdesi gereklidir', 400);
          }
        }

        return await handler(request, params);
      } catch (error) {
        logger.error('Validation middleware error', error);
        return errorResponse('İstek doğrulanması başarısız', 400);
      }
    };
  };
}

/**
 * Rate limiting middleware
 */
export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number; // milliseconds
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(options: RateLimitOptions) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, params) => {
      const key = getClientId(request);
      const now = Date.now();

      let clientRecord = requestCounts.get(key);

      if (!clientRecord || now > clientRecord.resetTime) {
        clientRecord = { count: 0, resetTime: now + options.windowMs };
        requestCounts.set(key, clientRecord);
      }

      if (clientRecord.count >= options.maxRequests) {
        return errorResponse('Çok fazla istek gönderdiniz. Lütfen sonra tekrar deneyin', 429);
      }

      clientRecord.count++;
      return await handler(request, params);
    };
  };
}

/**
 * CORS middleware
 */
export function withCors(allowedOrigins: string[] = ['http://localhost:3000']) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, params) => {
      const origin = request.headers.get('origin');

      if (origin && !allowedOrigins.includes(origin)) {
        return errorResponse('CORS policy violation', 403);
      }

      const response = await handler(request, params);

      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;
    };
  };
}

/**
 * Logging middleware
 */
export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request, params) => {
    const startTime = Date.now();

    const response = await handler(request, params);

    const duration = Date.now() - startTime;
    logger.info(`[${request.method}] ${request.url}`, {
      status: response.status,
      duration,
      durationMs: `${duration}ms`,
    });

    return response;
  };
}

/**
 * Method validation middleware
 */
export function withMethodCheck(allowedMethods: string[]) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, params) => {
      if (!allowedMethods.includes(request.method)) {
        return errorResponse(`${request.method} method bu endpoint'te desteklenmiyor`, 405);
      }

      return await handler(request, params);
    };
  };
}

/**
 * Helper to get client ID for rate limiting
 */
function getClientId(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Build a standardized API route handler
 *
 * @example
 * export const GET = buildApiRoute({
 *   requireModule: 'beneficiaries',
 *   allowedMethods: ['GET'],
 *   rateLimit: { maxRequests: 100, windowMs: 60000 }
 * })(async (request) => {
 *   // handler logic
 *   return successResponse(data);
 * });
 */
export function buildApiRoute(options: {
  requireModule?: string;
  allowedMethods?: string[];
  rateLimit?: RateLimitOptions;
  requireAuth?: boolean;
  supportOfflineSync?: boolean;
}) {
  return (handler: RouteHandler) => {
    let wrappedHandler = handler;

    // Apply middleware in order of importance
    wrappedHandler = withLogging(wrappedHandler);
    wrappedHandler = withErrorHandler(wrappedHandler);

    if (options.supportOfflineSync) {
      wrappedHandler = withOfflineSync(wrappedHandler);
    }

    if (options.allowedMethods) {
      wrappedHandler = withMethodCheck(options.allowedMethods)(wrappedHandler);
    }

    if (options.rateLimit) {
      wrappedHandler = withRateLimit(options.rateLimit)(wrappedHandler);
    }

    if (options.requireModule) {
      wrappedHandler = withModuleAccess(options.requireModule)(wrappedHandler);
    }

    if (options.requireAuth) {
      wrappedHandler = withAuth(wrappedHandler);
    }

    return wrappedHandler;
  };
}
