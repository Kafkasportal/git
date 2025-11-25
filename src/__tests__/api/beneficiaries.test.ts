/**
 * Beneficiaries API Route Tests
 * Tests for beneficiaries CRUD endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/appwrite/api', () => ({
  appwriteBeneficiaries: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    limit: params.get('limit') ? Number(params.get('limit')) : 20,
    skip: params.get('skip') ? Number(params.get('skip')) : 0,
    search: params.get('search') || undefined,
  })),
}));

vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read', 'beneficiaries:write'],
    },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Beneficiaries API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/beneficiaries', () => {
    it('should list beneficiaries with pagination', async () => {
      const { appwriteBeneficiaries } = await import('@/lib/appwrite/api');
      const mockBeneficiaries = [
        { _id: '1', name: 'Test Beneficiary 1', tc_no: '12345678901' },
        { _id: '2', name: 'Test Beneficiary 2', tc_no: '12345678902' },
      ];

      vi.mocked(appwriteBeneficiaries.list).mockResolvedValue({
        documents: mockBeneficiaries,
        total: 2,
      });

      const { GET } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries?limit=20&skip=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Test Beneficiary 1');
    });

    it('should filter by city', async () => {
      const { appwriteBeneficiaries } = await import('@/lib/appwrite/api');
      const mockBeneficiaries = [{ _id: '1', name: 'Test', city: 'Istanbul' }];

      vi.mocked(appwriteBeneficiaries.list).mockResolvedValue({
        documents: mockBeneficiaries,
        total: 1,
      });

      const { GET } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries?city=Istanbul');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(appwriteBeneficiaries.list).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Istanbul' })
      );
    });

    it('should require module access', async () => {
      const { requireAuthenticatedUser } = await import('@/lib/api/auth-utils');
      vi.mocked(requireAuthenticatedUser).mockRejectedValueOnce(
        new Error('Module access denied')
      );

      const { GET } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/beneficiaries', () => {
    it('should create beneficiary with valid data', async () => {
      const { appwriteBeneficiaries } = await import('@/lib/appwrite/api');
      const mockBeneficiary = {
        _id: 'new-id',
        name: 'New Beneficiary',
        tc_no: '12345678901',
        phone: '5551234567',
        address: 'Test Address 123',
      };

      vi.mocked(appwriteBeneficiaries.create).mockResolvedValue(mockBeneficiary as any);

      const { POST } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          name: 'New Beneficiary',
          tc_no: '12345678901',
          phone: '5551234567',
          address: 'Test Address 123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data._id).toBe('new-id');
      expect(appwriteBeneficiaries.create).toHaveBeenCalled();
    });

    it('should reject invalid beneficiary data', async () => {
      const { POST } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          name: 'A', // Too short
          tc_no: '123', // Invalid TC
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Doğrulama');
    });

    it('should handle duplicate TC number', async () => {
      const { appwriteBeneficiaries } = await import('@/lib/appwrite/api');
      vi.mocked(appwriteBeneficiaries.create).mockRejectedValueOnce(
        new Error('Duplicate TC number already exists')
      );

      const { POST } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          name: 'Test Beneficiary',
          tc_no: '12345678901',
          phone: '5551234567',
          address: 'Test Address 123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('TC Kimlik No zaten kayıtlı');
    });

    it('should require CSRF token', async () => {
      const { verifyCsrfToken } = await import('@/lib/api/auth-utils');
      vi.mocked(verifyCsrfToken).mockRejectedValueOnce(new Error('Invalid CSRF token'));

      const { POST } = await import('@/app/api/beneficiaries/route');
      const request = new NextRequest('http://localhost/api/beneficiaries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Beneficiary',
          tc_no: '12345678901',
          phone: '5551234567',
          address: 'Test Address 123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });
});

