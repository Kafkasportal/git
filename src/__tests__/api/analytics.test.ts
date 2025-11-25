import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock auth utils
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user-123', name: 'Test User' }),
  verifyCsrfToken: vi.fn().mockResolvedValue(true),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn().mockResolvedValue({ success: true }),
  dataModificationRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/analytics', () => {
    it('should track analytics event with valid data', async () => {
      const { POST } = await import('@/app/api/analytics/route');
      
      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        body: JSON.stringify({
          event: 'page_view',
          properties: { page: '/dashboard' },
          userId: 'user-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject request without event name', async () => {
      const { POST } = await import('@/app/api/analytics/route');
      
      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        body: JSON.stringify({
          properties: { page: '/dashboard' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Event name is required');
    });
  });

  describe('GET /api/analytics', () => {
    it('should return analytics stats for authenticated admin', async () => {
      const { GET } = await import('@/app/api/analytics/route');
      
      const request = new NextRequest('http://localhost:3000/api/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
