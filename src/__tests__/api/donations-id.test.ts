import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/donations/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteDonations: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  extractParams: vi.fn(async (params) => {
    const resolved = await params;
    return resolved;
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock sanitization
vi.mock('@/lib/sanitization', () => ({
  sanitizePhone: vi.fn((phone) => {
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

describe('GET /api/donations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns donation by ID successfully', async () => {
    const mockDonation = {
      _id: 'test-id',
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      donation_type: 'Nakit',
      payment_method: 'cash',
      donation_purpose: 'Test Purpose',
      receipt_number: 'REC-001',
      status: 'pending',
    };

    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(mockDonation);

    const request = new NextRequest('http://localhost/api/donations/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockDonation);
  });

  it('returns 404 when donation not found', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/donations/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bağış bulunamadı');
  });

  it('handles "stats" ID specially', async () => {
    const request = new NextRequest('http://localhost/api/donations/stats');
    const params = Promise.resolve({ id: 'stats' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Stats endpoint');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/donations/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/donations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates donation successfully', async () => {
    const updateData = {
      status: 'completed',
      amount: 2000,
    };

    const updatedDonation = {
      _id: 'test-id',
      donor_name: 'Test Donor',
      amount: 2000,
      currency: 'TRY',
      status: 'completed',
    };

    vi.mocked(appwriteApi.appwriteDonations.update).mockResolvedValue(updatedDonation as any);

    const request = new NextRequest('http://localhost/api/donations/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updatedDonation);
    expect(data.message).toBe('Bağış başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      amount: -100, // Invalid: negative amount
    };

    const request = new NextRequest('http://localhost/api/donations/test-id', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
  });

  it('validates status values', async () => {
    const invalidUpdate = {
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/donations/test-id', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 404 when donation not found', async () => {
    vi.mocked(appwriteApi.appwriteDonations.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      status: 'completed',
    };

    const request = new NextRequest('http://localhost/api/donations/non-existent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      status: 'completed',
    };

    const request = new NextRequest('http://localhost/api/donations/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('DELETE /api/donations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes donation successfully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/donations/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Bağış başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteDonations.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when donation not found', async () => {
    vi.mocked(appwriteApi.appwriteDonations.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/donations/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/donations/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
