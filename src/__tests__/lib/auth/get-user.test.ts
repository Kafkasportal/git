import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getCurrentUserId, getCurrentUser } from '@/lib/auth/get-user';

// Mock the session module
vi.mock('@/lib/auth/session', () => ({
  parseAuthSession: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock appwrite auth
vi.mock('@/lib/appwrite/auth', () => ({
  appwriteServerAuth: {
    getUser: vi.fn(),
  },
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

    it('should return null when no cookie is present', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await getCurrentUserId(request);

      expect(result).toBeNull();
    });

    it('should return null when session has no userId', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: '',
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUserId(request);

      expect(result).toBeNull();
    });

    it('should return null when session is expired', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: 'user123',
        expire: new Date(Date.now() - 1000).toISOString(), // Expired
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUserId(request);

      expect(result).toBeNull();
    });

    it('should return userId when session is not expired', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: 'user123',
        expire: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUserId(request);

      expect(result).toBe('user123');
    });

    it('should return null when request is not provided and cookies() fails', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockRejectedValue(new Error('No cookies'));

      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });

    it('should use cookies() when request is not provided', async () => {
      const { cookies } = await import('next/headers');
      const { parseAuthSession } = await import('@/lib/auth/session');
      
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'test-session' }),
      } as any);
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: 'user123',
      });

      const result = await getCurrentUserId();

      expect(result).toBe('user123');
    });

    it('should return null when cookies() returns no auth-session cookie', async () => {
      const { cookies } = await import('next/headers');
      
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when userId is null', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      vi.mocked(parseAuthSession).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUser(request);

      expect(result).toBeNull();
    });

    it('should return user when userId is valid', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      const { appwriteServerAuth } = await import('@/lib/appwrite/auth');
      
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: 'user123',
      });
      vi.mocked(appwriteServerAuth.getUser).mockResolvedValue({
        user: { id: 'user123', name: 'Test User', email: 'test@test.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUser(request);

      expect(result).toEqual({ id: 'user123', name: 'Test User', email: 'test@test.com' });
    });

    it('should return null when appwrite throws error', async () => {
      const { parseAuthSession } = await import('@/lib/auth/session');
      const { appwriteServerAuth } = await import('@/lib/appwrite/auth');
      
      vi.mocked(parseAuthSession).mockReturnValue({
        sessionId: 'session123',
        userId: 'user123',
      });
      vi.mocked(appwriteServerAuth.getUser).mockRejectedValue(new Error('User not found'));

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('auth-session', 'test-session');
      const result = await getCurrentUser(request);

      expect(result).toBeNull();
    });
  });
});

