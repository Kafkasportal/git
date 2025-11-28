import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/kumbara/[id]/route';
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

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GET /api/kumbara/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns kumbara donation by ID successfully', async () => {
    const mockDonation = {
      _id: 'test-id',
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      is_kumbara: true,
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      status: 'pending',
    };

    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(mockDonation);

    const request = new NextRequest('http://localhost/api/kumbara/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockDonation);
  });

  it('returns 404 when donation not found', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/kumbara/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışı bulunamadı');
  });

  it('returns 404 when donation is not a kumbara donation', async () => {
    const mockDonation = {
      _id: 'test-id',
      is_kumbara: false, // Not a kumbara donation
      donor_name: 'Test Donor',
    };

    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(mockDonation);

    const request = new NextRequest('http://localhost/api/kumbara/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bu ID bir kumbara bağışına ait değil');
  });

  it('returns 400 when ID is missing', async () => {
    const request = new NextRequest('http://localhost/api/kumbara/');
    const params = Promise.resolve({ id: '' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağış ID gereklidir');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kumbara/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışı getirilemedi');
  });
});

describe('PUT /api/kumbara/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates kumbara donation successfully', async () => {
    const updateData = {
      amount: 2000,
      kumbara_location: 'Updated Location',
    };

    // First GET to check it exists and is kumbara
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: true,
      amount: 1000,
      kumbara_location: 'Old Location',
    } as any);

    vi.mocked(appwriteApi.appwriteDonations.update).mockResolvedValue({
      _id: 'test-id',
      ...updateData,
      is_kumbara: true,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
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
    expect(data.message).toBe('Kumbara bağışı başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      amount: -100, // Invalid: negative amount
    };

    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: true,
    });

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
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

  it('returns 404 when donation not found', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(null);

    const updateData = {
      amount: 2000,
    };

    const request = new NextRequest('http://localhost/api/kumbara/non-existent', {
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
    expect(data.error).toBe('Kumbara bağışı bulunamadı');
  });

  it('returns 404 when donation is not a kumbara donation', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: false,
    });

    const updateData = {
      amount: 2000,
    };

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bu ID bir kumbara bağışına ait değil');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: true,
    });
    vi.mocked(appwriteApi.appwriteDonations.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      amount: 2000,
    };

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
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
    expect(data.error).toBe('Kumbara bağışı güncellenemedi');
  });
});

describe('DELETE /api/kumbara/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes kumbara donation successfully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: true,
      amount: 1000,
      kumbara_location: 'Test Location',
    } as any);
    vi.mocked(appwriteApi.appwriteDonations.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Kumbara bağışı başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteDonations.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when donation not found', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/kumbara/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışı bulunamadı');
  });

  it('returns 404 when donation is not a kumbara donation', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: false,
    });

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bu ID bir kumbara bağışına ait değil');
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.get).mockResolvedValue({
      _id: 'test-id',
      is_kumbara: true,
    });
    vi.mocked(appwriteApi.appwriteDonations.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kumbara/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışı silinemedi');
  });
});
