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
    name: 'Test Admin',
    role: 'ADMIN',
    permissions: ['audit:read']
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
      total: 3,
      documents: [
        { 
          $id: 'log-1', 
          action: 'user.login', 
          userId: 'user-1',
          timestamp: '2024-01-15T10:00:00Z',
          ipAddress: '192.168.1.1',
          details: { success: true },
        },
        { 
          $id: 'log-2', 
          action: 'beneficiary.create', 
          userId: 'user-2',
          timestamp: '2024-01-15T11:00:00Z',
          ipAddress: '192.168.1.2',
          details: { beneficiaryId: 'ben-1' },
        },
        { 
          $id: 'log-3', 
          action: 'donation.update', 
          userId: 'user-1',
          timestamp: '2024-01-15T12:00:00Z',
          ipAddress: '192.168.1.1',
          details: { donationId: 'don-1', amount: 1000 },
        },
      ],
    }),
    createDocument: vi.fn().mockResolvedValue({
      $id: 'new-log',
      action: 'test.action',
      timestamp: new Date().toISOString(),
    }),
  },
}));

// Mock Appwrite config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db-id',
    collections: {
      auditLogs: 'audit-logs-collection-id',
    },
  },
}));

describe('Audit Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/audit-logs', () => {
    it('should return list of audit logs for admin user', async () => {
      const { GET } = await import('@/app/api/audit-logs/route');
      
      const request = new NextRequest('http://localhost:3000/api/audit-logs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.logs).toBeDefined();
    });

    it('should filter logs by action type', async () => {
      const { GET } = await import('@/app/api/audit-logs/route');
      
      const request = new NextRequest('http://localhost:3000/api/audit-logs?action=user.login');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter logs by date range', async () => {
      const { GET } = await import('@/app/api/audit-logs/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter logs by user ID', async () => {
      const { GET } = await import('@/app/api/audit-logs/route');
      
      const request = new NextRequest('http://localhost:3000/api/audit-logs?userId=user-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should support pagination', async () => {
      const { GET } = await import('@/app/api/audit-logs/route');
      
      const request = new NextRequest('http://localhost:3000/api/audit-logs?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
