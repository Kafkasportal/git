import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/get-user';

// Mock the session module
vi.mock('@/lib/auth/session', () => ({
  parseAuthSession: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('get-user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserId', () => {
    it('should return user ID from session', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: 'user123',
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      // Mock cookie
      request.cookies.set('auth-session', 'test-session');
      
      const result = await getCurrentUserId(request);

      expect(result).toBe('user123');
    });

    it('should return null when session is null', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      vi.mocked(parseAuthSession).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUserId(request);

      expect(result).toBeNull();
    });

    it('should return null when request is not provided', async () => {
      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });
  });
});

