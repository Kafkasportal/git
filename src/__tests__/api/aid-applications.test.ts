import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn(),
  verifyCsrfToken: vi.fn(),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: <T>(handler: T) => handler,
  dataModificationRateLimit: <T>(handler: T) => handler,
}));

vi.mock('@/lib/appwrite/api', () => ({
  appwriteAidApplications: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
import { appwriteAidApplications } from '@/lib/appwrite/api';

describe('Aid Applications API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/aid-applications', () => {
    it('should require beneficiaries module access', async () => {
      (requireModuleAccess as Mock).mockRejectedValue(new Error('Unauthorized'));

      const { GET } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest('http://localhost:3000/api/aid-applications');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should list aid applications for authorized user', async () => {
      const mockApplications = {
        documents: [
          { $id: 'app-1', applicant_name: 'Ali Yılmaz', stage: 'under_review', status: 'open' },
          { $id: 'app-2', applicant_name: 'Ayşe Demir', stage: 'approved', status: 'open' },
        ],
        total: 2,
      };
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['beneficiaries:read'] },
        sessionId: 'session-1',
      });
      (appwriteAidApplications.list as Mock).mockResolvedValue(mockApplications);

      const { GET } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest('http://localhost:3000/api/aid-applications');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter by stage', async () => {
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['beneficiaries:read'] },
        sessionId: 'session-1',
      });
      (appwriteAidApplications.list as Mock).mockResolvedValue({ documents: [], total: 0 });

      const { GET } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest('http://localhost:3000/api/aid-applications?stage=approved');
      await GET(request);

      expect(appwriteAidApplications.list).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'approved' })
      );
    });

    it('should filter by beneficiary_id', async () => {
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['beneficiaries:read'] },
        sessionId: 'session-1',
      });
      (appwriteAidApplications.list as Mock).mockResolvedValue({ documents: [], total: 0 });

      const { GET } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest(
        'http://localhost:3000/api/aid-applications?beneficiary_id=ben-123'
      );
      await GET(request);

      expect(appwriteAidApplications.list).toHaveBeenCalledWith(
        expect.objectContaining({ beneficiary_id: 'ben-123' })
      );
    });
  });

  describe('POST /api/aid-applications', () => {
    it('should require CSRF token', async () => {
      (verifyCsrfToken as Mock).mockResolvedValue(false);

      const { POST } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest('http://localhost:3000/api/aid-applications', {
        method: 'POST',
        body: JSON.stringify({
          applicant_name: 'Test User',
          application_date: '2024-01-15',
          stage: 'draft',
          status: 'open',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      (verifyCsrfToken as Mock).mockResolvedValue(true);
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['beneficiaries:write'] },
        sessionId: 'session-1',
      });

      const { POST } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest('http://localhost:3000/api/aid-applications', {
        method: 'POST',
        body: JSON.stringify({
          applicant_name: 'A', // Too short
          stage: 'invalid',
          status: 'invalid',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should create aid application with valid data', async () => {
      const mockApplication = {
        $id: 'app-new',
        applicant_name: 'Test User',
        application_date: '2024-01-15',
        stage: 'draft',
        status: 'open',
      };
      (verifyCsrfToken as Mock).mockResolvedValue(true);
      (requireModuleAccess as Mock).mockResolvedValue({
        user: { id: 'user-1', permissions: ['beneficiaries:write'] },
        sessionId: 'session-1',
      });
      (appwriteAidApplications.create as Mock).mockResolvedValue(mockApplication);

      const { POST } = await import('@/app/api/aid-applications/route');
      const request = new NextRequest('http://localhost:3000/api/aid-applications', {
        method: 'POST',
        body: JSON.stringify({
          applicant_name: 'Test User',
          application_date: '2024-01-15',
          stage: 'draft',
          status: 'open',
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
