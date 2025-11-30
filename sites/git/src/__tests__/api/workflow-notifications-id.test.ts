import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/workflow-notifications/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteWorkflowNotifications: {
    get: vi.fn(),
    markAsSent: vi.fn(),
    markAsRead: vi.fn(),
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

describe('GET /api/workflow-notifications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns notification by ID successfully', async () => {
    const mockNotification = {
      _id: 'test-id',
      recipient: 'user1',
      title: 'Test Notification',
      category: 'meeting',
      status: 'beklemede',
    };

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.get).mockResolvedValue(mockNotification);

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockNotification);
  });

  it('returns 404 when notification not found', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/workflow-notifications/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bildirim bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.get).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PATCH /api/workflow-notifications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks notification as sent', async () => {
    const updateData = {
      status: 'gonderildi',
      sent_at: '2024-01-01T00:00:00Z',
    };

    const updatedNotification = {
      _id: 'test-id',
      status: 'gonderildi',
      sent_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.markAsSent).mockResolvedValue(
      updatedNotification as any
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id', {
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
    expect(data.data).toEqual(updatedNotification);
    expect(data.message).toBe('Bildirim güncellendi');
  });

  it('marks notification as read', async () => {
    const updateData = {
      status: 'okundu',
      read_at: '2024-01-01T00:00:00Z',
    };

    const updatedNotification = {
      _id: 'test-id',
      status: 'okundu',
      read_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.markAsRead).mockResolvedValue(
      updatedNotification as any
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id', {
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
    expect(data.data).toEqual(updatedNotification);
  });

  it('validates status values', async () => {
    const invalidUpdate = {
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id', {
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
    expect(data.error).toBe('Geçersiz bildirim durumu');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.markAsSent).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      status: 'gonderildi',
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id', {
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

describe('DELETE /api/workflow-notifications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes notification successfully', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Bildirim silindi');
    expect(vi.mocked(appwriteApi.appwriteWorkflowNotifications.remove)).toHaveBeenCalledWith(
      'test-id'
    );
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
