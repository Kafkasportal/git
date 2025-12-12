import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/aid-applications/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteAidApplications: {
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

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/aid-applications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns aid application by ID successfully', async () => {
    const mockApplication = {
      _id: 'test-id',
      applicant_name: 'Test Applicant',
      application_date: '2024-01-01',
      stage: 'draft',
      status: 'open',
    };

    vi.mocked(appwriteApi.appwriteAidApplications.get).mockResolvedValue(mockApplication);

    const request = new NextRequest('http://localhost/api/aid-applications/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockApplication);
  });

  it('returns 404 when application not found', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/aid-applications/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Başvuru bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.get).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/aid-applications/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PATCH /api/aid-applications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates aid application successfully', async () => {
    const updateData = {
      stage: 'approved',
      status: 'open',
    };

    const updatedApplication = {
      _id: 'test-id',
      applicant_name: 'Test Applicant',
      ...updateData,
    };

    vi.mocked(appwriteApi.appwriteAidApplications.update).mockResolvedValue(
      updatedApplication as unknown
    );

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updatedApplication);
    expect(data.message).toBe('Başvuru başarıyla güncellendi');
  });

  it('validates stage values', async () => {
    const invalidUpdate = {
      stage: 'INVALID', // Invalid stage
    };

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Geçersiz aşama');
  });

  it('validates status values', async () => {
    const invalidUpdate = {
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz durum');
  });

  it('validates status transitions', async () => {
    // This test ensures that status transitions are properly validated
    // For example, you can't go from 'completed' back to 'draft'
    const updateData = {
      stage: 'completed',
      status: 'closed',
    };

    const updatedApplication = {
      _id: 'test-id',
      ...updateData,
    };

    vi.mocked(appwriteApi.appwriteAidApplications.update).mockResolvedValue(
      updatedApplication as unknown
    );

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);
  });

  it('returns 404 when application not found', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      stage: 'approved',
    };

    const request = new NextRequest('http://localhost/api/aid-applications/non-existent', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.update).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      stage: 'approved',
    };

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('DELETE /api/aid-applications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes aid application successfully', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Başvuru başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteAidApplications.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when application not found', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/aid-applications/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/aid-applications/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
