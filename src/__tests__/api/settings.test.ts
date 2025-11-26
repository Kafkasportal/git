import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(),
  verifyCsrfToken: vi.fn(),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: <T>(handler: T) => handler,
  dataModificationRateLimit: <T>(handler: T) => handler,
}));

vi.mock('@/lib/appwrite/api', () => ({
  appwriteSystemSettings: {
    getAll: vi.fn(),
    getByCategory: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { requireAuthenticatedUser, verifyCsrfToken } from '@/lib/api/auth-utils';
import { appwriteSystemSettings } from '@/lib/appwrite/api';

describe('Settings API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return 403 if user lacks settings:manage permission', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: [] },
        sessionId: 'session-1',
      });

      const { GET } = await import('@/app/api/settings/route');
      const request = new NextRequest('http://localhost:3000/api/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should return all settings for authorized user', async () => {
      const mockSettings = { theme: 'dark', language: 'tr' };
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['settings:manage'] },
        sessionId: 'session-1',
      });
      (appwriteSystemSettings.getAll as Mock).mockResolvedValue(mockSettings);

      const { GET } = await import('@/app/api/settings/route');
      const request = new NextRequest('http://localhost:3000/api/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSettings);
    });

    it('should return settings by category when specified', async () => {
      const mockSettings = { darkMode: true };
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['settings:manage'] },
        sessionId: 'session-1',
      });
      (appwriteSystemSettings.getByCategory as Mock).mockResolvedValue(mockSettings);

      const { GET } = await import('@/app/api/settings/route');
      const request = new NextRequest('http://localhost:3000/api/settings?category=appearance');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(appwriteSystemSettings.getByCategory).toHaveBeenCalledWith('appearance');
    });
  });

  describe('POST /api/settings', () => {
    it('should require CSRF token for modifications', async () => {
      (verifyCsrfToken as Mock).mockResolvedValue(false);

      const { POST } = await import('@/app/api/settings/route');
      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should update settings with valid request', async () => {
      (verifyCsrfToken as Mock).mockResolvedValue(true);
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['settings:manage'] },
        sessionId: 'session-1',
      });
      (appwriteSystemSettings.upsert as Mock).mockResolvedValue({ success: true });

      const { POST } = await import('@/app/api/settings/route');
      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          settings: [{ key: 'theme', value: 'dark', category: 'appearance' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
