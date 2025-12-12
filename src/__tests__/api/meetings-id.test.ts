import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/meetings/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMeetings: {
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

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/meetings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns meeting by ID successfully', async () => {
    const mockMeeting = {
      _id: 'test-id',
      title: 'Test Meeting',
      meeting_date: '2024-01-15T10:00:00Z',
      organizer: 'user1',
      status: 'scheduled',
      meeting_type: 'general',
    };

    vi.mocked(appwriteApi.appwriteMeetings.get).mockResolvedValue(mockMeeting);

    const request = new NextRequest('http://localhost/api/meetings/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockMeeting);
  });

  it('returns 404 when meeting not found', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/meetings/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Toplantı bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/meetings/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/meetings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates meeting successfully', async () => {
    const updateData = {
      title: 'Updated Meeting',
      status: 'completed',
    };

    const updatedMeeting = {
      _id: 'test-id',
      title: 'Updated Meeting',
      status: 'completed',
    };

    vi.mocked(appwriteApi.appwriteMeetings.update).mockResolvedValue(updatedMeeting as any);

    const request = new NextRequest('http://localhost/api/meetings/test-id', {
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
    expect(data.data).toEqual(updatedMeeting);
    expect(data.message).toBe('Toplantı başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      title: 'AB', // Too short
    };

    const request = new NextRequest('http://localhost/api/meetings/test-id', {
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
      status: 'INVALID',
    };

    const request = new NextRequest('http://localhost/api/meetings/test-id', {
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

  it('returns 404 when meeting not found', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      title: 'Updated Meeting',
    };

    const request = new NextRequest('http://localhost/api/meetings/non-existent', {
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
    vi.mocked(appwriteApi.appwriteMeetings.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      title: 'Updated Meeting',
    };

    const request = new NextRequest('http://localhost/api/meetings/test-id', {
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

describe('DELETE /api/meetings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes meeting successfully', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/meetings/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Toplantı başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteMeetings.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when meeting not found', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/meetings/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/meetings/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
