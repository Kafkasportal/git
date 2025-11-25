import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/csrf/route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  generateCsrfToken: vi.fn(() => 'mock-csrf-token-12345'),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { cookies } from 'next/headers';

describe('CSRF API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/csrf', () => {
    it('should return existing CSRF token if already set', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: 'existing-token' }),
        set: vi.fn(),
      };
      (cookies as Mock).mockResolvedValue(mockCookieStore);

      const request = new NextRequest('http://localhost:3000/api/csrf');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe('existing-token');
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should generate new CSRF token if not exists', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
      };
      (cookies as Mock).mockResolvedValue(mockCookieStore);

      const request = new NextRequest('http://localhost:3000/api/csrf');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe('mock-csrf-token-12345');
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'csrf-token',
        'mock-csrf-token-12345',
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict',
          path: '/',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (cookies as Mock).mockRejectedValue(new Error('Cookie error'));

      const request = new NextRequest('http://localhost:3000/api/csrf');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to generate CSRF token');
    });
  });
});
