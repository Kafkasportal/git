import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/donations/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteDonations: {
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
  buildApiRoute: vi.fn((_options) => (handler: unknown) => handler),
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

// Mock sanitization
vi.mock('@/lib/sanitization', () => ({
  sanitizePhone: vi.fn((phone) => {
    // Simple sanitization mock
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return cleaned.substring(1);
    }
    if (cleaned.startsWith('90')) {
      return cleaned.substring(2);
    }
    return cleaned;
  }),
}));

// Mock validations
vi.mock('@/lib/validations/shared-validators', () => ({
  phoneSchema: {
    safeParse: vi.fn((value) => {
      // Simple phone validation: should start with 5 and be 10 digits
      if (typeof value === 'string' && /^5\d{9}$/.test(value)) {
        return { success: true };
      }
      return { success: false, error: { message: 'Invalid phone' } };
    }),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/donations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns donations list successfully', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test Donor',
        amount: 1000,
        currency: 'TRY',
        donation_type: 'Nakit',
        payment_method: 'cash',
        donation_purpose: 'Test Purpose',
        receipt_number: 'REC-001',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test Donor 2',
        amount: 500,
        currency: 'TRY',
        donation_type: 'Online',
        payment_method: 'online',
        donation_purpose: 'Test Purpose 2',
        receipt_number: 'REC-002',
        status: 'completed',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/donations');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockDonations);
  });

  it('filters by donor_email', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test Donor',
        donor_email: 'test@example.com',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/donations?donor_email=test@example.com');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteDonations.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        donor_email: 'test@example.com',
      })
    );
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/donations?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteDonations.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/donations');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });
});

describe('POST /api/donations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates donation successfully', async () => {
    const newDonation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: 1000,
      currency: 'TRY',
      donation_type: 'Nakit',
      payment_method: 'cash',
      donation_purpose: 'Test Purpose',
      receipt_number: 'REC-001',
    };

    const createdDonation = {
      _id: 'new-id',
      ...newDonation,
      status: 'pending',
    };

    vi.mocked(appwriteApi.appwriteDonations.create).mockResolvedValue(createdDonation as any);

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(newDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdDonation);
    expect(data.message).toBe('Bağış başarıyla oluşturuldu');
  });

  it('validates required fields', async () => {
    const invalidDonation = {
      donor_name: 'T', // Too short
      // Missing required fields
    };

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
  });

  it('validates amount is positive', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: -100, // Negative amount
      currency: 'TRY',
      donation_type: 'Nakit',
      donation_purpose: 'Test',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates currency', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: 1000,
      currency: 'INVALID', // Invalid currency
      donation_type: 'Nakit',
      donation_purpose: 'Test',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
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
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: 1000,
      currency: 'TRY',
      donor_email: 'invalid-email', // Invalid email
      donation_type: 'Nakit',
      donation_purpose: 'Test',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates missing required fields', async () => {
    const incompleteDonation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: 1000,
      currency: 'TRY',
      // Missing donation_type, donation_purpose, receipt_number
    };

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(incompleteDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Zorunlu alanlar eksik');
    expect(data.details).toBeDefined();
  });

  it('handles duplicate receipt number', async () => {
    const donation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: 1000,
      currency: 'TRY',
      donation_type: 'Nakit',
      donation_purpose: 'Test',
      receipt_number: 'REC-001',
    };

    vi.mocked(appwriteApi.appwriteDonations.create).mockRejectedValue(
      new Error('receipt_number unique constraint violation')
    );

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(donation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bu makbuz numarası zaten kullanılmış');
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.create).mockRejectedValue(new Error('Database error'));

    const validDonation = {
      donor_name: 'Test Donor',
      donor_phone: '5551234567',
      amount: 1000,
      currency: 'TRY',
      donation_type: 'Nakit',
      donation_purpose: 'Test Purpose',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/donations', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Bağış kaydedilemedi');
  });
});
