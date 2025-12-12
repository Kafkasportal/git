import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/meeting-decisions/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMeetingDecisions: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['workflow:read'] },
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

describe('GET /api/meeting-decisions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns decision by ID successfully', async () => {
    const mockDecision = {
      _id: 'test-id',
      meeting_id: 'meeting-1',
      title: 'Test Decision',
      status: 'acik',
    };

    vi.mocked(appwriteApi.appwriteMeetingDecisions.get).mockResolvedValue(mockDecision);

    const request = new NextRequest('http://localhost/api/meeting-decisions/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockDecision);
  });

  it('returns 404 when decision not found', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/meeting-decisions/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Toplantı kararı bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.get).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/meeting-decisions/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/meeting-decisions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates decision successfully', async () => {
    const updateData = {
      title: 'Updated Decision',
      status: 'kapatildi',
    };

    const updatedDecision = {
      _id: 'test-id',
      ...updateData,
      meeting_id: 'meeting-1',
    };

    vi.mocked(appwriteApi.appwriteMeetingDecisions.update).mockResolvedValue(
      updatedDecision as unknown
    );

    const request = new NextRequest('http://localhost/api/meeting-decisions/test-id', {
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
    expect(data.data).toEqual(updatedDecision);
    expect(data.message).toBe('Toplantı kararı güncellendi');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.update).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      title: 'Updated Decision',
    };

    const request = new NextRequest('http://localhost/api/meeting-decisions/test-id', {
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

describe('DELETE /api/meeting-decisions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes decision successfully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/meeting-decisions/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Toplantı kararı silindi');
    expect(vi.mocked(appwriteApi.appwriteMeetingDecisions.remove)).toHaveBeenCalledWith('test-id');
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/meeting-decisions/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
