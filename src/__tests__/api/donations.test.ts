/**
 * Donations API Route Tests
 * Tests for donations CRUD endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/appwrite/api', () => ({
  appwriteDonations: {
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
      permissions: ['donations:read', 'donations:write'],
    },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/sanitization', () => ({
  sanitizePhone: vi.fn((phone: string) => {
    // Mock sanitization: remove non-digits and ensure 5XXXXXXXXX format
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('05')) {
      return digits.substring(1);
    }
    if (digits.length === 12 && digits.startsWith('905')) {
      return digits.substring(2);
    }
    if (digits.length === 10 && digits.startsWith('5')) {
      return digits;
    }
    return null;
  }),
}));

vi.mock('@/lib/validations/shared-validators', () => ({
  phoneSchema: {
    safeParse: vi.fn((phone: string) => ({
      success: phone && phone.length === 10 && phone.startsWith('5'),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Donations API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/donations', () => {
    it('should list donations with pagination', async () => {
      const { appwriteDonations } = await import('@/lib/appwrite/api');
      const mockDonations = [
        { _id: '1', donor_name: 'Donor 1', amount: 100, currency: 'TRY' },
        { _id: '2', donor_name: 'Donor 2', amount: 200, currency: 'TRY' },
      ];

      vi.mocked(appwriteDonations.list).mockResolvedValue({
        documents: mockDonations,
        total: 2,
      });

      const { GET } = await import('@/app/api/donations/route');
      const request = new NextRequest('http://localhost/api/donations?limit=20&skip=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].donor_name).toBe('Donor 1');
    });

    it('should filter by donor email', async () => {
      const { appwriteDonations } = await import('@/lib/appwrite/api');
      const mockDonations = [{ _id: '1', donor_name: 'Donor', donor_email: 'donor@example.com' }];

      vi.mocked(appwriteDonations.list).mockResolvedValue({
        documents: mockDonations,
        total: 1,
      });

      const { GET } = await import('@/app/api/donations/route');
      const request = new NextRequest('http://localhost/api/donations?donor_email=donor@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(appwriteDonations.list).toHaveBeenCalledWith(
        expect.objectContaining({ donor_email: 'donor@example.com' })
      );
    });
  });

  describe('POST /api/donations', () => {
    it('should create donation with valid data', async () => {
      const { appwriteDonations } = await import('@/lib/appwrite/api');
      const mockDonation = {
        _id: 'new-id',
        donor_name: 'Test Donor',
        amount: 500,
        currency: 'TRY',
        status: 'pending',
      };

      vi.mocked(appwriteDonations.create).mockResolvedValue(mockDonation as any);

      const { POST } = await import('@/app/api/donations/route');
      const request = new NextRequest('http://localhost/api/donations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          donor_name: 'Test Donor',
          amount: 500,
          currency: 'TRY',
          donor_phone: '5551234567',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data._id).toBe('new-id');
      expect(appwriteDonations.create).toHaveBeenCalled();
    });

    it('should reject invalid donation data', async () => {
      const { POST } = await import('@/app/api/donations/route');
      const request = new NextRequest('http://localhost/api/donations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          donor_name: 'A', // Too short
          amount: -100, // Negative amount
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Doğrulama');
    });

    it('should sanitize phone number', async () => {
      const { appwriteDonations } = await import('@/lib/appwrite/api');
      const { sanitizePhone } = await import('@/lib/sanitization');
      const mockDonation = { _id: 'new-id', donor_name: 'Test', amount: 100 };

      vi.mocked(appwriteDonations.create).mockResolvedValue(mockDonation as any);

      const { POST } = await import('@/app/api/donations/route');
      const request = new NextRequest('http://localhost/api/donations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          donor_name: 'Test Donor',
          amount: 100,
          currency: 'TRY',
          donor_phone: '05551234567', // Turkish format with leading 0
        }),
      });

      await POST(request);

      expect(sanitizePhone).toHaveBeenCalledWith('05551234567');
    });
  });
});

