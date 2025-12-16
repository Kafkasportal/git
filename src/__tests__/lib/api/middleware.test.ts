/**
 * API Middleware Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock('@/lib/api/auth-utils', () => ({
    requireModuleAccess: vi.fn(),
}));

vi.mock('@/lib/api/route-helpers', () => ({
    errorResponse: vi.fn((message: string, status: number) =>
        NextResponse.json({ success: false, error: message }, { status })
    ),
}));

import {
    compose,
    withAuth,
    withModuleAccess,
    withOfflineSync,
    withErrorHandler,
    withValidation,
    withRateLimit,
    withCors,
    withLogging,
    withMethodCheck,
    buildApiRoute,
} from '@/lib/api/middleware';
import { requireModuleAccess } from '@/lib/api/auth-utils';

// Helper to create mock request
function createMockRequest(options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
} = {}): NextRequest {
    const { method = 'GET', url = 'http://localhost:3000/api/test', headers = {} } = options;

    return {
        method,
        url,
        headers: {
            get: (name: string) => headers[name.toLowerCase()] || null,
        },
        body: options.body,
    } as unknown as NextRequest;
}

// Helper to create mock handler
function createMockHandler(response?: NextResponse) {
    return vi.fn().mockResolvedValue(
        response || NextResponse.json({ success: true, data: {} })
    );
}

describe('API Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('compose', () => {
        const createHeaderMiddleware = (headerName: string) => {
            const spy = vi.fn();
            const middleware = (handler: any) => {
                spy();
                return async (req: NextRequest, context?: any) => {
                    const response = await handler(req, context);
                    response.headers.set(headerName, 'true');
                    return response;
                };
            };
            return { middleware, spy };
        };

        it('should compose multiple middleware functions', async () => {
            const { middleware: middleware1, spy: middleware1Spy } = createHeaderMiddleware('X-Middleware-1');
            const { middleware: middleware2, spy: middleware2Spy } = createHeaderMiddleware('X-Middleware-2');

            const handler = createMockHandler();
            const composed = compose(middleware1, middleware2)(handler);
            const request = createMockRequest();
            
            const response = await composed(request);

            expect(middleware1Spy).toHaveBeenCalled();
            expect(middleware2Spy).toHaveBeenCalled();
            expect(response.headers.get('X-Middleware-1')).toBe('true');
            expect(response.headers.get('X-Middleware-2')).toBe('true');
        });
    });

    describe('withAuth', () => {
        it('should pass through when auth succeeds', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withAuth(handler);

            const request = createMockRequest();
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });

        it('should return 401 when auth fails', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Auth failed'));
            const wrappedHandler = withAuth(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(401);
        });
    });

    describe('withModuleAccess', () => {
        it('should pass through when module access is granted', async () => {
            vi.mocked(requireModuleAccess).mockResolvedValue({
                session: { sessionId: 'session-1', userId: 'user-1' },
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com', permissions: [], isActive: true },
            } as Awaited<ReturnType<typeof requireModuleAccess>>);

            const handler = createMockHandler();
            const wrappedHandler = withModuleAccess('beneficiaries')(handler);

            const request = createMockRequest();
            await wrappedHandler(request);

            expect(requireModuleAccess).toHaveBeenCalledWith('beneficiaries');
            expect(handler).toHaveBeenCalled();
        });

        it('should return 403 when module access is denied', async () => {
            vi.mocked(requireModuleAccess).mockRejectedValue(new Error('Access denied'));

            const handler = createMockHandler();
            const wrappedHandler = withModuleAccess('admin')(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(403);
        });
    });

    describe('withOfflineSync', () => {
        it('should pass through normally', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withOfflineSync(handler);

            const request = createMockRequest();
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });

        it('should log when force overwrite header is present', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withOfflineSync(handler);

            const request = createMockRequest({
                headers: { 'x-force-overwrite': 'true' },
            });
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });
    });

    describe('withErrorHandler', () => {
        it('should pass through successful responses', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(200);
        });

        it('should handle duplicate entry errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Duplicate key error'));
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(409);
        });

        it('should handle validation errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Validation failed'));
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(400);
        });

        it('should handle not found errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Document not found'));
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(404);
        });

        it('should handle missing required attribute errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Missing required attribute: name'));
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(400);
        });

        it('should handle invalid document structure errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Invalid document structure'));
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(400);
        });

        it('should handle generic errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Unknown error'));
            const wrappedHandler = withErrorHandler(handler);

            const request = createMockRequest();
            const response = await wrappedHandler(request);

            expect(response.status).toBe(500);
        });
    });

    describe('withValidation', () => {
        it('should pass through when body is not required', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withValidation()(handler);

            const request = createMockRequest({ method: 'POST' });
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });

        it('should return 400 when body is required but missing', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withValidation({ requireBody: true })(handler);

            const request = createMockRequest({ method: 'POST', body: undefined });
            const response = await wrappedHandler(request);

            expect(response.status).toBe(400);
        });

        it('should pass through for GET requests even with requireBody', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withValidation({ requireBody: true })(handler);

            const request = createMockRequest({ method: 'GET' });
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });
    });

    describe('withRateLimit', () => {
        it('should allow requests within limit', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withRateLimit({ maxRequests: 5, windowMs: 60000 })(handler);

            const request = createMockRequest({
                headers: { 'x-forwarded-for': 'unique-client-1' },
            });

            const response = await wrappedHandler(request);
            expect(response.status).toBe(200);
        });

        it('should block requests exceeding limit', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withRateLimit({ maxRequests: 2, windowMs: 60000 })(handler);

            const request = createMockRequest({
                headers: { 'x-forwarded-for': 'rate-limited-client' },
            });

            // First two requests should succeed
            await wrappedHandler(request);
            await wrappedHandler(request);

            // Third request should be rate limited
            const response = await wrappedHandler(request);
            expect(response.status).toBe(429);
        });
    });

    describe('withCors', () => {
        it('should add CORS headers for allowed origin', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withCors(['http://localhost:3000'])(handler);

            const request = createMockRequest({
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await wrappedHandler(request);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
        });

        it('should reject requests from disallowed origins', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withCors(['http://localhost:3000'])(handler);

            const request = createMockRequest({
                headers: { origin: 'http://evil.com' },
            });

            const response = await wrappedHandler(request);
            expect(response.status).toBe(403);
        });
    });

    describe('withLogging', () => {
        it('should log request details', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withLogging(handler);

            const request = createMockRequest();
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });
    });

    describe('withMethodCheck', () => {
        it('should allow valid methods', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withMethodCheck(['GET', 'POST'])(handler);

            const request = createMockRequest({ method: 'GET' });
            await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
        });

        it('should reject invalid methods', async () => {
            const handler = createMockHandler();
            const wrappedHandler = withMethodCheck(['GET'])(handler);

            const request = createMockRequest({ method: 'DELETE' });
            const response = await wrappedHandler(request);

            expect(response.status).toBe(405);
        });
    });

    describe('buildApiRoute', () => {
        it('should build route with all options', async () => {
            vi.mocked(requireModuleAccess).mockResolvedValue({
                session: { sessionId: 'session-1', userId: 'user-1' },
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com', permissions: [], isActive: true },
            } as Awaited<ReturnType<typeof requireModuleAccess>>);

            const handler = createMockHandler();
            const builtRoute = buildApiRoute({
                requireModule: 'beneficiaries',
                allowedMethods: ['GET'],
                requireAuth: true,
                supportOfflineSync: true,
            })(handler);

            const request = createMockRequest({ method: 'GET' });
            await builtRoute(request);

            expect(handler).toHaveBeenCalled();
        });

        it('should build route with rate limiting', async () => {
            const handler = createMockHandler();
            const builtRoute = buildApiRoute({
                rateLimit: { maxRequests: 100, windowMs: 60000 },
            })(handler);

            const request = createMockRequest({
                headers: { 'x-forwarded-for': 'build-api-client' },
            });
            await builtRoute(request);

            expect(handler).toHaveBeenCalled();
        });
    });
});
