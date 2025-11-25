/**
 * API Middleware Tests
 * Tests for rate limiting, CSRF, and auth middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildApiRoute,
  withRateLimit,
  withMethodCheck,
  withErrorHandler,
} from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/route-helpers';

vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: 'user-123', permissions: ['test:read'] },
  }),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('API Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const handler = withRateLimit({ maxRequests: 5, windowMs: 60000 })(
        async () => successResponse({ data: 'test' })
      );

      const request = new NextRequest('http://localhost/api/test');
      request.headers.set('x-forwarded-for', '127.0.0.1');

      for (let i = 0; i < 5; i++) {
        const response = await handler(request);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it('should reject requests exceeding rate limit', async () => {
      const handler = withRateLimit({ maxRequests: 2, windowMs: 60000 })(
        async () => successResponse({ data: 'test' })
      );

      const request = new NextRequest('http://localhost/api/test');
      request.headers.set('x-forwarded-for', '127.0.0.1');

      // Make 2 requests (within limit)
      await handler(request);
      await handler(request);

      // 3rd request should be rejected
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Çok fazla istek');
    });

    it('should reset rate limit after window expires', async () => {
      vi.useFakeTimers();
      const handler = withRateLimit({ maxRequests: 2, windowMs: 1000 })(
        async () => successResponse({ data: 'test' })
      );

      const request = new NextRequest('http://localhost/api/test');
      request.headers.set('x-forwarded-for', '127.0.0.1');

      // Make 2 requests
      await handler(request);
      await handler(request);

      // Advance time past window
      vi.advanceTimersByTime(1001);

      // Should allow request again
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Method Check', () => {
    it('should allow allowed methods', async () => {
      const handler = withMethodCheck(['GET', 'POST'])(async () =>
        successResponse({ data: 'test' })
      );

      const getRequest = new NextRequest('http://localhost/api/test', { method: 'GET' });
      const getResponse = await handler(getRequest);
      expect(getResponse.status).toBe(200);

      const postRequest = new NextRequest('http://localhost/api/test', { method: 'POST' });
      const postResponse = await handler(postRequest);
      expect(postResponse.status).toBe(200);
    });

    it('should reject disallowed methods', async () => {
      const handler = withMethodCheck(['GET'])(async () => successResponse({ data: 'test' }));

      const request = new NextRequest('http://localhost/api/test', { method: 'DELETE' });
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toContain('DELETE method bu endpoint');
    });
  });

  describe('Error Handler', () => {
    it('should handle duplicate key errors', async () => {
      const handler = withErrorHandler(async () => {
        throw new Error('Duplicate key error');
      });

      const request = new NextRequest('http://localhost/api/test');
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('zaten mevcut');
    });

    it('should handle validation errors', async () => {
      const handler = withErrorHandler(async () => {
        throw new Error('Validation error: invalid input');
      });

      const request = new NextRequest('http://localhost/api/test');
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Doğrulama');
    });

    it('should handle not found errors', async () => {
      const handler = withErrorHandler(async () => {
        throw new Error('Record not found');
      });

      const request = new NextRequest('http://localhost/api/test');
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('bulunamadı');
    });

    it('should handle generic errors', async () => {
      const handler = withErrorHandler(async () => {
        throw new Error('Generic server error');
      });

      const request = new NextRequest('http://localhost/api/test');
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('buildApiRoute', () => {
    it('should apply all middleware in correct order', async () => {
      const handler = buildApiRoute({
        requireModule: 'test',
        allowedMethods: ['GET'],
        rateLimit: { maxRequests: 10, windowMs: 60000 },
      })(async (request) => {
        return successResponse({ method: request.method });
      });

      const request = new NextRequest('http://localhost/api/test', { method: 'GET' });
      request.headers.set('x-forwarded-for', '127.0.0.1');

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.method).toBe('GET');
    });

    it('should reject invalid methods', async () => {
      const handler = buildApiRoute({
        requireModule: 'test',
        allowedMethods: ['GET'],
      })(async () => successResponse({ data: 'test' }));

      const request = new NextRequest('http://localhost/api/test', { method: 'POST' });
      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
    });
  });
});

