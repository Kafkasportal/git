/**
 * Tasks API Route Tests
 * Tests for tasks CRUD endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/appwrite/api', () => ({
  appwriteTasks: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    limit: params.get('limit') ? Number(params.get('limit')) : 20,
    skip: params.get('skip') ? Number(params.get('skip')) : 0,
    search: params.get('search') || undefined,
  })),
}));

vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      permissions: ['workflow:read', 'workflow:write'],
    },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Tasks API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should list tasks with pagination', async () => {
      const { appwriteTasks } = await import('@/lib/appwrite/api');
      const mockTasks = [
        { _id: '1', title: 'Task 1', status: 'pending' },
        { _id: '2', title: 'Task 2', status: 'in_progress' },
      ];

      vi.mocked(appwriteTasks.list).mockResolvedValue({
        documents: mockTasks,
        total: 2,
      });

      const { GET } = await import('@/app/api/tasks/route');
      const request = new NextRequest('http://localhost/api/tasks?limit=20&skip=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].title).toBe('Task 1');
    });

    it('should filter by assigned_to', async () => {
      const { appwriteTasks } = await import('@/lib/appwrite/api');
      const mockTasks = [{ _id: '1', title: 'Task', assigned_to: 'user-123' }];

      vi.mocked(appwriteTasks.list).mockResolvedValue({
        documents: mockTasks,
        total: 1,
      });

      const { GET } = await import('@/app/api/tasks/route');
      const request = new NextRequest('http://localhost/api/tasks?assigned_to=user-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(appwriteTasks.list).toHaveBeenCalledWith(
        expect.objectContaining({ assigned_to: 'user-123' })
      );
    });
  });

  describe('POST /api/tasks', () => {
    it('should create task with valid data', async () => {
      const { appwriteTasks } = await import('@/lib/appwrite/api');
      const mockTask = {
        _id: 'new-id',
        title: 'New Task',
        status: 'pending',
        priority: 'normal',
        created_by: 'user-123',
      };

      vi.mocked(appwriteTasks.create).mockResolvedValue(mockTask as any);

      const { POST } = await import('@/app/api/tasks/route');
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          title: 'New Task',
          created_by: 'user-123',
          priority: 'normal',
          status: 'pending',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data._id).toBe('new-id');
      expect(appwriteTasks.create).toHaveBeenCalled();
    });

    it('should reject invalid task data', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': 'test-token' },
        body: JSON.stringify({
          title: 'AB', // Too short
          priority: 'invalid', // Invalid priority
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Doğrulama');
    });
  });
});

