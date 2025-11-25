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
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ 
    id: 'user-123', 
    name: 'Test User',
    permissions: ['communication:read', 'communication:write']
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(true),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn().mockResolvedValue({ success: true }),
  dataModificationRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Appwrite server
vi.mock('@/lib/appwrite/server', () => ({
  serverDatabases: {
    listDocuments: vi.fn().mockResolvedValue({
      total: 2,
      documents: [
        { 
          $id: 'msg-1', 
          subject: 'Duyuru', 
          content: 'Test duyuru',
          recipientType: 'all',
          status: 'sent',
          createdAt: '2024-01-15T10:00:00Z',
        },
        { 
          $id: 'msg-2', 
          subject: 'Hatırlatma', 
          content: 'Toplantı hatırlatması',
          recipientType: 'selected',
          status: 'draft',
          createdAt: '2024-01-16T14:00:00Z',
        },
      ],
    }),
    createDocument: vi.fn().mockResolvedValue({
      $id: 'new-msg',
      subject: 'Yeni Mesaj',
      content: 'Mesaj içeriği',
      status: 'draft',
    }),
    getDocument: vi.fn().mockResolvedValue({
      $id: 'msg-1',
      subject: 'Duyuru',
      content: 'Test duyuru',
      status: 'sent',
    }),
    updateDocument: vi.fn().mockResolvedValue({
      $id: 'msg-1',
      subject: 'Güncellenmiş Duyuru',
      status: 'sent',
    }),
  },
}));

// Mock Appwrite config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db-id',
    collections: {
      communications: 'communications-collection-id',
      communicationLogs: 'comm-logs-collection-id',
    },
  },
}));

describe('Communication API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/communication', () => {
    it('should return list of communications for authenticated user', async () => {
      const { GET } = await import('@/app/api/communication/route');
      
      const request = new NextRequest('http://localhost:3000/api/communication');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter communications by type', async () => {
      const { GET } = await import('@/app/api/communication/route');
      
      const request = new NextRequest('http://localhost:3000/api/communication?type=email');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid communication type', async () => {
      const { GET } = await import('@/app/api/communication/route');
      
      const request = new NextRequest('http://localhost:3000/api/communication?type=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/communication', () => {
    it('should update communication settings with valid data', async () => {
      const { PUT } = await import('@/app/api/communication/route');
      
      const request = new NextRequest('http://localhost:3000/api/communication?type=email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          enabled: true,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
