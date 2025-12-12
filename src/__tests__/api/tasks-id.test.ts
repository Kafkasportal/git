import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/tasks/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteTasks: {
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

describe('GET /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns task by ID successfully', async () => {
    const mockTask = {
      _id: 'test-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending',
      priority: 'normal',
      assigned_to: 'user1',
      created_by: 'user1',
    };

    vi.mocked(appwriteApi.appwriteTasks.get).mockResolvedValue(mockTask);

    const request = new NextRequest('http://localhost/api/tasks/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockTask);
  });

  it('returns 404 when task not found', async () => {
    vi.mocked(appwriteApi.appwriteTasks.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/tasks/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Görev bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTasks.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/tasks/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Veri alınamadı');
  });
});

describe('PUT /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates task successfully', async () => {
    const updateData = {
      title: 'Updated Task',
      status: 'completed',
      priority: 'high',
    };

    const updatedTask = {
      _id: 'test-id',
      title: 'Updated Task',
      status: 'completed',
      priority: 'high',
    };

    vi.mocked(appwriteApi.appwriteTasks.update).mockResolvedValue(updatedTask as unknown);

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
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
    expect(data.data).toEqual(updatedTask);
    expect(data.message).toBe('Görev başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      title: 'AB', // Too short
    };

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
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

  it('validates priority values', async () => {
    const invalidUpdate = {
      priority: 'INVALID',
    };

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
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

  it('validates status values', async () => {
    const invalidUpdate = {
      status: 'INVALID',
    };

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
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

  it('returns 404 when task not found', async () => {
    vi.mocked(appwriteApi.appwriteTasks.update).mockRejectedValue(new Error('Document not found'));

    const updateData = {
      title: 'Updated Task',
    };

    const request = new NextRequest('http://localhost/api/tasks/non-existent', {
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
    expect(data.error).toBe('Görev bulunamadı');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTasks.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      title: 'Updated Task',
    };

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
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

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes task successfully', async () => {
    vi.mocked(appwriteApi.appwriteTasks.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Görev başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteTasks.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when task not found', async () => {
    vi.mocked(appwriteApi.appwriteTasks.remove).mockRejectedValue(new Error('Document not found'));

    const request = new NextRequest('http://localhost/api/tasks/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Görev bulunamadı');
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTasks.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/tasks/test-id', {
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
