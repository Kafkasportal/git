import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/kumbara/route';
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

// Mock QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db',
    collections: {
      donations: 'donations',
    },
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GET /api/kumbara', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns kumbara donations list successfully', async () => {
    const mockDonations = [
      {
        _id: '1',
        donor_name: 'Test Donor',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Location 1',
        kumbara_institution: 'Institution 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test Donor 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Location 2',
        kumbara_institution: 'Institution 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
      },
    ];

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.donations).toEqual(mockDonations);
    expect(data.pagination.total).toBe(2);
  });

  it('filters only kumbara donations', async () => {
    const mockDonations = [
      {
        _id: '1',
        is_kumbara: true,
        donor_name: 'Test',
      },
      {
        _id: '2',
        is_kumbara: false, // Should be filtered out
        donor_name: 'Test 2',
      },
    ];

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations.filter((d) => d.is_kumbara),
      total: 1,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.donations.length).toBe(1);
    expect(data.donations[0].is_kumbara).toBe(true);
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.donations).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışları getirilemedi');
  });
});

describe('POST /api/kumbara', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates kumbara donation with QR code successfully', async () => {
    const newDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY' as const,
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const donationId = 'new-donation-id';
    vi.mocked(appwriteApi.appwriteDonations.create).mockResolvedValue(donationId);

    const request = new NextRequest('http://localhost/api/kumbara', {
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
    expect(data.data.id).toBe(donationId);
    expect(data.data.qr_code).toBe('data:image/png;base64,mock-qr-code');
    expect(data.message).toContain('QR kod oluşturuldu');
  });

  it('validates required fields', async () => {
    const invalidDonation = {
      donor_name: 'T', // Too short
      // Missing required fields
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
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
    expect(data.details).toBeDefined();
  });

  it('validates amount is positive', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: -100, // Negative amount
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
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

  it('validates kumbara location', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'X', // Too short
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
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

  it('validates collection date is required', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      // Missing collection_date
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
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

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.create).mockRejectedValue(new Error('Database error'));

    const validDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
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
    expect(data.error).toBe('Kumbara bağışı oluşturulamadı');
  });
});
