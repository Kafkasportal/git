import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/beneficiaries/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteBeneficiaries: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
  })),
}));

// Mock middleware
vi.mock('@/lib/api/middleware', () => ({
  buildApiRoute: vi.fn((_options) => (handler: any) => handler),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  successResponse: vi.fn((data, message, status = 200) => {
    return new Response(JSON.stringify({ success: true, data, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  errorResponse: vi.fn((error, status = 400, details?: string[]) => {
    return new Response(JSON.stringify({ success: false, error, details }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  parseBody: vi.fn(async (request) => {
    const body = await request.json();
    return { data: body, error: null };
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: 'test-user', role: 'Personel' },
  }),
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

describe('GET /api/beneficiaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns beneficiaries list successfully', async () => {
    const mockBeneficiaries = createMockDocuments([
      {
        _id: '1',
        name: 'Test Beneficiary',
        tc_no: '12345678901',
        phone: '+905551234567',
        address: 'Test Address 123',
        city: 'Istanbul',
        status: 'AKTIF',
      },
      {
        _id: '2',
        name: 'Test Beneficiary 2',
        tc_no: '12345678902',
        phone: '+905551234568',
        address: 'Test Address 456',
        city: 'Ankara',
        status: 'PASIF',
      },
    ]);

    vi.mocked(appwriteApi.appwriteBeneficiaries.list).mockResolvedValue({
      documents: mockBeneficiaries,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/beneficiaries');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockBeneficiaries);
    expect(data.message).toContain('2 kayıt bulundu');
  });

  it('filters by city', async () => {
    const mockBeneficiaries = createMockDocuments([
      {
        _id: '1',
        name: 'Test Beneficiary',
        city: 'Istanbul',
      },
    ]);

    vi.mocked(appwriteApi.appwriteBeneficiaries.list).mockResolvedValue({
      documents: mockBeneficiaries,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/beneficiaries?city=Istanbul');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteBeneficiaries.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Istanbul',
      })
    );
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/beneficiaries?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteBeneficiaries.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/beneficiaries');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.message).toContain('0 kayıt bulundu');
  });
});

describe('POST /api/beneficiaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates beneficiary successfully', async () => {
    const newBeneficiary = {
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Test Address 123 Street',
      city: 'Istanbul',
      status: 'TASLAK',
    };

    const createdBeneficiary = {
      _id: 'new-id',
      ...newBeneficiary,
    };

    vi.mocked(appwriteApi.appwriteBeneficiaries.create).mockResolvedValue(
      createdBeneficiary as any
    );

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(newBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdBeneficiary);
    expect(data.message).toBe('İhtiyaç sahibi başarıyla oluşturuldu');
  });

  it('validates required fields', async () => {
    const invalidBeneficiary = {
      name: 'T', // Too short
      // Missing required fields
    };

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(invalidBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toBeDefined();
  });

  it('validates TC number format', async () => {
    const invalidBeneficiary = {
      name: 'Test Beneficiary',
      tc_no: '123', // Invalid: not 11 digits
      phone: '+905551234567',
      address: 'Test Address 123 Street',
    };

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(invalidBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates phone number format', async () => {
    const invalidBeneficiary = {
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '123', // Invalid: too short
      address: 'Test Address 123 Street',
    };

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(invalidBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates address length', async () => {
    const invalidBeneficiary = {
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Short', // Invalid: less than 10 characters
    };

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(invalidBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates email format when provided', async () => {
    const invalidBeneficiary = {
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Test Address 123 Street',
      email: 'invalid-email', // Invalid email format
    };

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(invalidBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates status values', async () => {
    const invalidBeneficiary = {
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Test Address 123 Street',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(invalidBeneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('handles duplicate TC number', async () => {
    const beneficiary = {
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Test Address 123 Street',
    };

    vi.mocked(appwriteApi.appwriteBeneficiaries.create).mockRejectedValue(
      new Error('TC number already exists')
    );

    const request = new NextRequest('http://localhost/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(beneficiary),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bu TC Kimlik No zaten kayıtlı');
  });
});
