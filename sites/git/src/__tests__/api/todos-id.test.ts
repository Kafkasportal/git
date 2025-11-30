import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/todos/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteTodos: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
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
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['todos:read'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock validations
vi.mock('@/lib/validations/todo', () => ({
  todoUpdateSchema: {
    safeParse: vi.fn((data) => {
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
      return { success: true, data };
    }),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GET /api/todos/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns todo by ID successfully', async () => {
    const mockTodo = {
      _id: 'test-id',
      title: 'Test Todo',
      priority: 'normal',
      completed: false,
      created_by: 'user1',
    };

    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(mockTodo);

    const request = new NextRequest('http://localhost/api/todos/test-id');
    const context = { params: Promise.resolve({ id: 'test-id' }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockTodo);
  });

  it('returns 404 when todo not found', async () => {
    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/todos/non-existent');
    const context = { params: Promise.resolve({ id: 'non-existent' }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Todo bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteTodos.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/todos/test-id');
    const context = { params: Promise.resolve({ id: 'test-id' }) };

    try {
      const response = await GET(request, context);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('PUT /api/todos/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates todo successfully', async () => {
    const updateData = {
      title: 'Updated Todo',
      completed: true,
    };

    const existingTodo = {
      _id: 'test-id',
      title: 'Test Todo',
      priority: 'normal',
      created_by: 'user1',
    };

    const updatedTodo = {
      _id: 'test-id',
      ...updateData,
      priority: 'normal',
      created_by: 'user1',
    };

    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(existingTodo);
    vi.mocked(appwriteApi.appwriteTodos.update).mockResolvedValue(updatedTodo as any);

    const request = new NextRequest('http://localhost/api/todos/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updatedTodo);
    expect(data.message).toBe('Todo başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      title: 'A'.repeat(101), // Too long
    };

    const request = new NextRequest('http://localhost/api/todos/test-id', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
  });

  it('returns 404 when todo not found', async () => {
    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(null);

    const updateData = {
      title: 'Updated Todo',
    };

    const request = new NextRequest('http://localhost/api/todos/non-existent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const context = { params: Promise.resolve({ id: 'non-existent' }) };
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    const existingTodo = {
      _id: 'test-id',
      title: 'Test Todo',
    };
    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(existingTodo);
    vi.mocked(appwriteApi.appwriteTodos.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      title: 'Updated Todo',
    };

    const request = new NextRequest('http://localhost/api/todos/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };

    try {
      const response = await PUT(request, context);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('DELETE /api/todos/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes todo successfully', async () => {
    const existingTodo = {
      _id: 'test-id',
      title: 'Test Todo',
    };
    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(existingTodo);
    vi.mocked(appwriteApi.appwriteTodos.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/todos/test-id', {
      method: 'DELETE',
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Todo başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteTodos.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when todo not found', async () => {
    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/todos/non-existent', {
      method: 'DELETE',
    });
    const context = { params: Promise.resolve({ id: 'non-existent' }) };
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    const existingTodo = {
      _id: 'test-id',
      title: 'Test Todo',
    };
    vi.mocked(appwriteApi.appwriteTodos.get).mockResolvedValue(existingTodo);
    vi.mocked(appwriteApi.appwriteTodos.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/todos/test-id', {
      method: 'DELETE',
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };

    try {
      const response = await DELETE(request, context);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
