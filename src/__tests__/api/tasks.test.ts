import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/tasks/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteTasks: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
  })),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  parseBody: vi.fn(async (request) => {
    const body = await request.json();
    return { data: body, error: null };
  }),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn((handler) => handler),
  dataModificationRateLimit: vi.fn((handler) => handler),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tasks list successfully', async () => {
    const mockTasks = createMockDocuments([
      {
        _id: '1',
        title: 'Test Task 1',
        description: 'Test Description',
        status: 'pending',
        priority: 'normal',
        assigned_to: 'user1',
        created_by: 'user1',
      },
      {
        _id: '2',
        title: 'Test Task 2',
        description: 'Test Description 2',
        status: 'in_progress',
        priority: 'high',
        assigned_to: 'user2',
        created_by: 'user1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteTasks.list).mockResolvedValue({
      documents: mockTasks,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/tasks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockTasks);
    expect(data.total).toBe(2);
  });

  it('filters by assigned_to', async () => {
    const mockTasks = createMockDocuments([
      {
        _id: '1',
        title: 'Test Task',
        assigned_to: 'user1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteTasks.list).mockResolvedValue({
      documents: mockTasks,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/tasks?assigned_to=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteTasks.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        assigned_to: 'user1',
      })
    );
  });

  it('filters by created_by', async () => {
    const mockTasks = createMockDocuments([
      {
        _id: '1',
        title: 'Test Task',
        created_by: 'user1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteTasks.list).mockResolvedValue({
      documents: mockTasks,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/tasks?created_by=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteTasks.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by: 'user1',
      })
    );
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteTasks.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/tasks?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteTasks.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteTasks.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/tasks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTasks.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/tasks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Veri alınamadı');
  });
});

describe('POST /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates task successfully', async () => {
    const newTask = {
      title: 'New Test Task',
      description: 'Test Description',
      assigned_to: 'user1',
      created_by: 'user1',
      priority: 'high',
      status: 'pending',
    };

    const createdTask = {
      _id: 'new-id',
      ...newTask,
    };

    vi.mocked(appwriteApi.appwriteTasks.create).mockResolvedValue(createdTask as any);

    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdTask);
    expect(data.message).toBe('Görev başarıyla oluşturuldu');
  });

  it('validates title is required and minimum length', async () => {
    const invalidTask = {
      title: 'AB', // Too short (less than 3 characters)
      description: 'Test',
    };

    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(invalidTask),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Görev başlığı en az 3 karakter olmalıdır');
  });

  it('validates priority values', async () => {
    const invalidTask = {
      title: 'Valid Title',
      priority: 'INVALID', // Invalid priority
    };

    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(invalidTask),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz öncelik değeri');
  });

  it('validates status values', async () => {
    const invalidTask = {
      title: 'Valid Title',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(invalidTask),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz durum');
  });

  it('sets default values for status and priority', async () => {
    const newTask = {
      title: 'New Test Task',
      created_by: 'user1',
    };

    const createdTask = {
      _id: 'new-id',
      ...newTask,
      status: 'pending',
      priority: 'normal',
    };

    vi.mocked(appwriteApi.appwriteTasks.create).mockResolvedValue(createdTask as any);

    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTasks.create).mockRejectedValue(new Error('Database error'));

    const validTask = {
      title: 'Valid Task',
      created_by: 'user1',
    };

    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(validTask),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Oluşturma işlemi başarısız');
  });
});
