import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: (handler: Function) => handler,
  mutationRateLimit: (handler: Function) => handler,
}));

vi.mock('@/lib/appwrite/api', () => ({
  appwriteSystemSettings: {
    getByCategory: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { appwriteSystemSettings } from '@/lib/appwrite/api';

describe('Security API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/security', () => {
    it('should return 403 if user is not super admin', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
        sessionId: 'session-1',
      });

      const { GET } = await import('@/app/api/security/route');
      const request = new NextRequest('http://localhost:3000/api/security');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('super admin');
    });

    it('should return security settings for super admin', async () => {
      const mockSettings = {
        passwordMinLength: 8,
        sessionTimeout: 3600,
        require2FA: false,
      };
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', role: 'SUPER_ADMIN' },
        sessionId: 'session-1',
      });
      (appwriteSystemSettings.getByCategory as Mock).mockResolvedValue(mockSettings);

      const { GET } = await import('@/app/api/security/route');
      const request = new NextRequest('http://localhost:3000/api/security');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSettings);
    });
  });

  describe('PUT /api/security', () => {
    it('should return 403 if user is not super admin', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
        sessionId: 'session-1',
      });

      const { PUT } = await import('@/app/api/security/route');
      const request = new NextRequest('http://localhost:3000/api/security?type=password', {
        method: 'PUT',
        body: JSON.stringify({ minLength: 10 }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should reject invalid security type', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', role: 'SUPER_ADMIN' },
        sessionId: 'session-1',
      });

      const { PUT } = await import('@/app/api/security/route');
      const request = new NextRequest('http://localhost:3000/api/security?type=invalid', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should update password settings', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', role: 'SUPER_ADMIN' },
        sessionId: 'session-1',
      });
      (appwriteSystemSettings.updateSettings as Mock).mockResolvedValue({ success: true });

      const { PUT } = await import('@/app/api/security/route');
      const request = new NextRequest('http://localhost:3000/api/security?type=password', {
        method: 'PUT',
        body: JSON.stringify({ minLength: 12, requireUppercase: true }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
