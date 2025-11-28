import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/partners/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwritePartners: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/partners/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns partner by ID successfully', async () => {
    const mockPartner = {
      _id: 'test-id',
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'donor',
      status: 'active',
    };

    vi.mocked(appwriteApi.appwritePartners.get).mockResolvedValue(mockPartner);

    const request = new NextRequest('http://localhost/api/partners/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockPartner);
  });

  it('returns 404 when partner not found', async () => {
    vi.mocked(appwriteApi.appwritePartners.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/partners/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Partner bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwritePartners.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/partners/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/partners/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates partner successfully', async () => {
    const updateData = {
      name: 'Updated Partner',
      email: 'updated@example.com',
    };

    const updatedPartner = {
      _id: 'test-id',
      ...updateData,
      type: 'organization',
      partnership_type: 'donor',
      status: 'active',
    };

    vi.mocked(appwriteApi.appwritePartners.update).mockResolvedValue(updatedPartner as any);

    const request = new NextRequest('http://localhost/api/partners/test-id', {
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
    expect(data.data).toEqual(updatedPartner);
    expect(data.message).toBe('Partner başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      name: 'A', // Too short
    };

    const request = new NextRequest('http://localhost/api/partners/test-id', {
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

  it('validates type values', async () => {
    const invalidUpdate = {
      type: 'INVALID',
    };

    const request = new NextRequest('http://localhost/api/partners/test-id', {
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

  it('validates email format when provided', async () => {
    const invalidUpdate = {
      email: 'invalid-email',
    };

    const request = new NextRequest('http://localhost/api/partners/test-id', {
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

  it('returns 500 when update fails', async () => {
    vi.mocked(appwriteApi.appwritePartners.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      name: 'Updated Partner',
    };

    const request = new NextRequest('http://localhost/api/partners/test-id', {
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

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwritePartners.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      name: 'Updated Partner',
    };

    const request = new NextRequest('http://localhost/api/partners/test-id', {
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

describe('DELETE /api/partners/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes partner successfully', async () => {
    const mockPartner = {
      _id: 'test-id',
      name: 'Test Partner',
    };
    vi.mocked(appwriteApi.appwritePartners.get).mockResolvedValue(mockPartner);
    vi.mocked(appwriteApi.appwritePartners.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/partners/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Partner başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwritePartners.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when partner not found', async () => {
    vi.mocked(appwriteApi.appwritePartners.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/partners/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Partner bulunamadı');
  });

  it('handles delete errors gracefully', async () => {
    const mockPartner = {
      _id: 'test-id',
      name: 'Test Partner',
    };
    vi.mocked(appwriteApi.appwritePartners.get).mockResolvedValue(mockPartner);
    vi.mocked(appwriteApi.appwritePartners.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/partners/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
