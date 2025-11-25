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
    permissions: ['meetings:read', 'meetings:write', 'meetings:delete']
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
          $id: 'meeting-1', 
          title: 'Aylık Toplantı', 
          date: '2024-01-15',
          status: 'completed'
        },
        { 
          $id: 'meeting-2', 
          title: 'Yönetim Kurulu', 
          date: '2024-01-20',
          status: 'scheduled'
        },
      ],
    }),
    createDocument: vi.fn().mockResolvedValue({
      $id: 'new-meeting',
      title: 'Yeni Toplantı',
      date: '2024-02-01',
      status: 'scheduled',
    }),
    getDocument: vi.fn().mockResolvedValue({
      $id: 'meeting-1',
      title: 'Aylık Toplantı',
      date: '2024-01-15',
      status: 'completed',
    }),
    updateDocument: vi.fn().mockResolvedValue({
      $id: 'meeting-1',
      title: 'Güncellenmiş Toplantı',
      status: 'completed',
    }),
    deleteDocument: vi.fn().mockResolvedValue(true),
  },
}));

// Mock Appwrite config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db-id',
    collections: {
      meetings: 'meetings-collection-id',
      meetingDecisions: 'decisions-collection-id',
      meetingActionItems: 'action-items-collection-id',
    },
  },
}));

describe('Meetings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/meetings', () => {
    it('should return list of meetings for authenticated user', async () => {
      const { GET } = await import('@/app/api/meetings/route');
      
      const request = new NextRequest('http://localhost:3000/api/meetings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meetings).toBeDefined();
      expect(Array.isArray(data.meetings)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const { GET } = await import('@/app/api/meetings/route');
      
      const request = new NextRequest('http://localhost:3000/api/meetings?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/meetings', () => {
    it('should create new meeting with valid data', async () => {
      const { POST } = await import('@/app/api/meetings/route');
      
      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          title: 'Yeni Toplantı',
          date: '2024-02-01',
          location: 'Dernek Merkezi',
          agenda: 'Gündem maddeleri',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.meeting).toBeDefined();
    });

    it('should reject meeting creation without title', async () => {
      const { POST } = await import('@/app/api/meetings/route');
      
      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          date: '2024-02-01',
          location: 'Dernek Merkezi',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
