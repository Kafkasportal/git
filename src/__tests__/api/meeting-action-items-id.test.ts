import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, PATCH, DELETE } from '@/app/api/meeting-action-items/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMeetingActionItems: {
    get: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
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

describe('GET /api/meeting-action-items/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns action item by ID successfully', async () => {
    const mockActionItem = {
      _id: 'test-id',
      meeting_id: 'meeting-1',
      title: 'Test Action Item',
      assigned_to: 'user1',
      status: 'beklemede',
    };

    vi.mocked(appwriteApi.appwriteMeetingActionItems.get).mockResolvedValue(mockActionItem);

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockActionItem);
  });

  it('returns 404 when action item not found', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/meeting-action-items/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Toplantı görevi bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.get).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/meeting-action-items/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates action item successfully', async () => {
    const updateData = {
      title: 'Updated Action Item',
      status: 'hazir',
    };

    const updatedActionItem = {
      _id: 'test-id',
      ...updateData,
      meeting_id: 'meeting-1',
      assigned_to: 'user1',
    };

    vi.mocked(appwriteApi.appwriteMeetingActionItems.update).mockResolvedValue(
      updatedActionItem as unknown
    );

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id', {
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
    expect(data.data).toEqual(updatedActionItem);
    expect(data.message).toBe('Toplantı görevi güncellendi');
  });

  it('updates action item status via PATCH', async () => {
    const updateData = {
      status: 'hazir',
      changed_by: 'test-user',
    };

    const updatedActionItem = {
      _id: 'test-id',
      status: 'hazir',
    };

    vi.mocked(appwriteApi.appwriteMeetingActionItems.updateStatus).mockResolvedValue(
      updatedActionItem as unknown
    );

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id', {
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
  });

  it('validates status and changed_by for PATCH', async () => {
    const invalidUpdate = {
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id', {
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
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.update).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      title: 'Updated Action Item',
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id', {
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

describe('DELETE /api/meeting-action-items/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes action item successfully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Toplantı görevi silindi');
    expect(vi.mocked(appwriteApi.appwriteMeetingActionItems.remove)).toHaveBeenCalledWith(
      'test-id'
    );
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/meeting-action-items/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
