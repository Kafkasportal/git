import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn(),
  verifyCsrfToken: vi.fn(),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/appwrite/api', () => ({
  appwriteMessages: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => {
    const result: Record<string, string> = {};
    params.forEach((value: string, key: string) => {
      result[key] = value;
    });
    return result;
  }),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { requireModuleAccess, verifyCsrfToken } from '@/lib/api/auth-utils';
import { appwriteMessages } from '@/lib/appwrite/api';

describe('Messages API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/messages', () => {
    it('should require messages module access', async () => {
      (requireModuleAccess as Mock).mockRejectedValue(new Error('Unauthorized'));

      const { GET } = await import('@/app/api/messages/route');
      const request = new NextRequest('http://localhost:3000/api/messages');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should list messages for authorized user', async () => {
      const mockMessages = {
        documents: [
          { $id: 'msg-1', content: 'Test message 1', status: 'sent' },
          { $id: 'msg-2', content: 'Test message 2', status: 'draft' },
        ],
        total: 2,
      };
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['messages:read'] },
        sessionId: 'session-1',
      });
      (appwriteMessages.list as Mock).mockResolvedValue(mockMessages);

      const { GET } = await import('@/app/api/messages/route');
      const request = new NextRequest('http://localhost:3000/api/messages');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should restrict viewing others messages without users:manage permission', async () => {
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['messages:read'] },
        sessionId: 'session-1',
      });

      const { GET } = await import('@/app/api/messages/route');
      const request = new NextRequest('http://localhost:3000/api/messages?sender=other-user');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/messages', () => {
    it('should require CSRF token', async () => {
      (verifyCsrfToken as Mock).mockResolvedValue(false);

      const { POST } = await import('@/app/api/messages/route');
      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          message_type: 'internal',
          recipients: ['user-2'],
          content: 'Test message',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate message data', async () => {
      (verifyCsrfToken as Mock).mockResolvedValue(true);
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['messages:write'] },
        sessionId: 'session-1',
      });

      const { POST } = await import('@/app/api/messages/route');
      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          message_type: 'invalid',
          recipients: [],
          content: '',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should create message with valid data', async () => {
      const mockMessage = {
        $id: 'msg-new',
        message_type: 'internal',
        recipients: ['user-2'],
        content: 'Hello!',
        status: 'draft',
      };
      (verifyCsrfToken as Mock).mockResolvedValue(true);
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['messages:write'] },
        sessionId: 'session-1',
      });
      (appwriteMessages.create as Mock).mockResolvedValue(mockMessage);

      const { POST } = await import('@/app/api/messages/route');
      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          message_type: 'internal',
          recipients: ['user-2'],
          content: 'Hello!',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });
});
