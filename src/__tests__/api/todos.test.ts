import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/todos/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteTodos: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
    skip: 0,
    search: params.get('search') || undefined,
  })),
}));

// Mock middleware
vi.mock('@/lib/api/middleware', () => ({
  buildApiRoute: vi.fn((_config) => (handler: any) => handler),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  successResponse: vi.fn((data, message, status = 200) => {
    return new Response(JSON.stringify({ success: true, data, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  errorResponse: vi.fn((message, status = 400, details?: string[]) => {
    return new Response(JSON.stringify({ success: false, error: message, details }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  parseBody: vi.fn(async (request) => {
    const body = await request.json();
    return { data: body, error: null };
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: 'test-user', permissions: ['todos:read'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock validations
vi.mock('@/lib/validations/todo', () => ({
  todoSchema: {
    safeParse: vi.fn((data) => {
      // Basic validation
      if (!data.title || data.title.trim().length === 0) {
        return {
          success: false,
          error: {
            flatten: () => ({
              fieldErrors: { title: ['Yapılacak başlığı boş olamaz'] },
            }),
          },
        };
      }
      if (data.title && data.title.length > 100) {
        return {
          success: false,
          error: {
            flatten: () => ({
              fieldErrors: { title: ['Yapılacak başlığı en fazla 100 karakter olmalıdır'] },
            }),
          },
        };
      }
      if (!data.created_by) {
        return {
          success: false,
          error: {
            flatten: () => ({
              fieldErrors: { created_by: ['Oluşturan kullanıcı zorunludur'] },
            }),
          },
        };
      }
      if (data.priority && !['low', 'normal', 'high', 'urgent'].includes(data.priority)) {
        return {
          success: false,
          error: {
            flatten: () => ({
              fieldErrors: { priority: ['Öncelik seçiniz'] },
            }),
          },
        };
      }
      return {
        success: true,
        data: {
          title: data.title,
          created_by: data.created_by,
          priority: data.priority || 'normal',
          completed: data.completed || false,
          is_read: data.is_read || false,
          description: data.description,
          due_date: data.due_date,
          tags: data.tags,
        },
      };
    }),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GET /api/todos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns todos list successfully', async () => {
    const mockTodos = [
      {
        _id: '1',
        title: 'Todo 1',
        priority: 'normal',
        completed: false,
        created_by: 'user1',
      },
      {
        _id: '2',
        title: 'Todo 2',
        priority: 'high',
        completed: true,
        created_by: 'user1',
      },
    ];

    vi.mocked(appwriteApi.appwriteTodos.list).mockResolvedValue({
      documents: mockTodos,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/todos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.data).toEqual(mockTodos);
    expect(data.data.total).toBe(2);
  });

  it('filters by completed status', async () => {
    const mockTodos = [
      {
        _id: '1',
        title: 'Completed Todo',
        completed: true,
      },
    ];

    vi.mocked(appwriteApi.appwriteTodos.list).mockResolvedValue({
      documents: mockTodos,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/todos?completed=true');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteTodos.list)).toHaveBeenCalled();
  });

  it('filters by priority', async () => {
    const mockTodos = [
      {
        _id: '1',
        title: 'High Priority Todo',
        priority: 'high',
      },
    ];

    vi.mocked(appwriteApi.appwriteTodos.list).mockResolvedValue({
      documents: mockTodos,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/todos?priority=high');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteTodos.list)).toHaveBeenCalled();
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteTodos.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/todos?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteTodos.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteTodos.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/todos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toEqual([]);
    expect(data.data.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTodos.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/todos');

    try {
      const response = await GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('POST /api/todos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates todo successfully', async () => {
    const newTodo = {
      title: 'New Todo',
      created_by: 'test-user',
      priority: 'normal',
      is_read: false,
    };

    const createdTodo = {
      $id: 'new-id',
      ...newTodo,
      completed: false,
    };

    vi.mocked(appwriteApi.appwriteTodos.create).mockResolvedValue(createdTodo as any);

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdTodo);
    expect(data.message).toBe('Todo başarıyla oluşturuldu');
  });

  it('validates title is required', async () => {
    const invalidTodo = {
      created_by: 'test-user',
      // Missing title
    };

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(invalidTodo),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
  });

  it('validates title maximum length', async () => {
    const invalidTodo = {
      title: 'A'.repeat(101), // Too long
      created_by: 'test-user',
    };

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(invalidTodo),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates created_by is required', async () => {
    const invalidTodo = {
      title: 'Test Todo',
      // Missing created_by
    };

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(invalidTodo),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates priority values', async () => {
    const invalidTodo = {
      title: 'Test Todo',
      created_by: 'test-user',
      priority: 'INVALID', // Invalid priority
    };

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(invalidTodo),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('sets default priority to normal', async () => {
    const newTodo = {
      title: 'Test Todo',
      created_by: 'test-user',
      is_read: false,
      // No priority provided
    };

    const createdTodo = {
      $id: 'new-id',
      ...newTodo,
      priority: 'normal',
      completed: false,
    };

    vi.mocked(appwriteApi.appwriteTodos.create).mockResolvedValue(createdTodo as any);

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
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
    vi.mocked(appwriteApi.appwriteTodos.create).mockRejectedValue(new Error('Database error'));

    const validTodo = {
      title: 'Test Todo',
      created_by: 'test-user',
      is_read: false,
    };

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify(validTodo),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    try {
      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
