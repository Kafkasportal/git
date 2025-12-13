import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/workflow-notifications/[id]/route';
import * as appwriteApi from '@/lib/appwrite/api';
import {
  runGetByIdTests,
  runUpdateTests,
  runDeleteTests,
} from '../test-utils/test-patterns';
import {
  createTestRequest,
  createTestParams,
  parseJsonResponse,
  expectStatus,
  expectSuccessResponse,
  expectErrorResponse,
} from '../test-utils/api-test-helpers';

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

// Use test pattern for GET by ID
runGetByIdTests(
  { GET },
  appwriteApi.appwriteWorkflowNotifications.get as (id: string) => Promise<unknown>,
  'workflow-notifications',
  {
    baseUrl: 'http://localhost/api/workflow-notifications',
    notFoundError: 'Bildirim bulunamadı',
    errorMessage: 'Bildirim getirilemedi',
  }
);

// Use test pattern for PATCH update
runUpdateTests(
  { PATCH },
  appwriteApi.appwriteWorkflowNotifications.markAsSent as (id: string, data: unknown) => Promise<unknown>,
  'workflow-notifications',
  {
    status: 'gonderildi',
    sent_at: '2024-01-01T00:00:00Z',
  },
  {
    method: 'PATCH',
    baseUrl: 'http://localhost/api/workflow-notifications',
    successMessage: 'Bildirim güncellendi',
    errorMessage: 'Bildirim güncellenemedi',
  }
);

// Use test pattern for DELETE
runDeleteTests(
  { DELETE },
  appwriteApi.appwriteWorkflowNotifications.remove as (id: string) => Promise<void>,
  'workflow-notifications',
  {
    baseUrl: 'http://localhost/api/workflow-notifications',
    successMessage: 'Bildirim silindi',
    errorMessage: 'Bildirim silinemedi',
  }
);

describe('PATCH /api/workflow-notifications/[id] - Specific tests', () => {
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

    const request = createTestRequest('http://localhost/api/workflow-notifications/test-id', {
      method: 'PATCH',
      body: updateData,
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await parseJsonResponse(response);

    expectStatus(response, 200);
    expectSuccessResponse(data);
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

    const request = createTestRequest('http://localhost/api/workflow-notifications/test-id', {
      method: 'PATCH',
      body: updateData,
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await parseJsonResponse(response);

    expectStatus(response, 200);
    expectSuccessResponse(data);
    expect(data.data).toEqual(updatedNotification);
  });

  it('validates status values', async () => {
    const invalidUpdate = {
      status: 'INVALID',
    };

    const request = createTestRequest('http://localhost/api/workflow-notifications/test-id', {
      method: 'PATCH',
      body: invalidUpdate,
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await parseJsonResponse(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.error).toBe('Geçersiz bildirim durumu');
  });
});
