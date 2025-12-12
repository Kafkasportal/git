import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/beneficiaries/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteBeneficiaries: {
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
  requireModuleAccess: vi.fn().mockResolvedValue({
    user: { id: 'test-user', role: 'Personel' },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/beneficiaries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns beneficiary by ID successfully', async () => {
    const mockBeneficiary = {
      _id: 'test-id',
      name: 'Test Beneficiary',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Test Address 123',
      city: 'Istanbul',
      status: 'AKTIF',
    };

    vi.mocked(appwriteApi.appwriteBeneficiaries.get).mockResolvedValue(mockBeneficiary);

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockBeneficiary);
  });

  it('returns 404 when beneficiary not found', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/beneficiaries/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('İhtiyaç sahibi bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Veri alınamadı');
  });
});

describe('PUT /api/beneficiaries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates beneficiary successfully', async () => {
    const updateData = {
      name: 'Updated Name',
      city: 'Ankara',
    };

    const updatedBeneficiary = {
      _id: 'test-id',
      name: 'Updated Name',
      tc_no: '12345678901',
      phone: '+905551234567',
      address: 'Test Address 123',
      city: 'Ankara',
      status: 'AKTIF',
    };

    vi.mocked(appwriteApi.appwriteBeneficiaries.update).mockResolvedValue(
      updatedBeneficiary as unknown
    );

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id', {
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
    expect(data.data).toEqual(updatedBeneficiary);
    expect(data.message).toBe('İhtiyaç sahibi başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      name: 'T', // Too short
    };

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id', {
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

  it('returns 404 when beneficiary not found', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      name: 'Updated Name',
    };

    const request = new NextRequest('http://localhost/api/beneficiaries/non-existent', {
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
    expect(data.error).toBe('İhtiyaç sahibi bulunamadı');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.update).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      name: 'Updated Name',
    };

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id', {
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
    expect(data.error).toBe('Güncelleme işlemi başarısız');
  });
});

describe('DELETE /api/beneficiaries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes beneficiary successfully', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('İhtiyaç sahibi başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteBeneficiaries.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when beneficiary not found', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/beneficiaries/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('İhtiyaç sahibi bulunamadı');
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteBeneficiaries.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/beneficiaries/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Silme işlemi başarısız');
  });
});
