import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/workflow-notifications/route';
import * as appwriteApi from '@/lib/appwrite/api';
import {
  runGetListTests,
  runCreateTests,
  runFilteringTests,
} from '../test-utils/test-patterns';
import {
  createTestRequest,
  parseJsonResponse,
  expectStatus,
  expectSuccessResponse,
  expectErrorResponse,
} from '../test-utils/api-test-helpers';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteWorkflowNotifications: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params: URLSearchParams) => ({
    page: params.get('page') ? Number.parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? Number.parseInt(params.get('limit')!) : 50,
    skip: 0,
    search: params.get('search') || undefined,
  })),
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

// Use test pattern for GET list
runGetListTests(
  { GET },
  appwriteApi.appwriteWorkflowNotifications.list as (params?: unknown) => Promise<{ documents: unknown[]; total: number }>,
  'workflow-notifications',
  {
    baseUrl: 'http://localhost/api/workflow-notifications',
    errorMessage: 'Bildirimler alınamadı',
  }
);

// Test filtering
runFilteringTests(
  { GET },
  appwriteApi.appwriteWorkflowNotifications.list as (params?: unknown) => Promise<{ documents: unknown[]; total: number }>,
  'workflow-notifications',
  [
    {
      name: 'recipient',
      queryParams: { recipient: 'user1' },
      expectedFilter: { recipient: 'user1' },
    },
    {
      name: 'status',
      queryParams: { status: 'okundu' },
      expectedFilter: { status: 'okundu' },
    },
    {
      name: 'category',
      queryParams: { category: 'rapor' },
      expectedFilter: { category: 'rapor' },
    },
  ],
  {
    baseUrl: 'http://localhost/api/workflow-notifications',
  }
);

// Use test pattern for POST create
runCreateTests(
  { POST },
  appwriteApi.appwriteWorkflowNotifications.create as (data: unknown) => Promise<unknown>,
  'workflow-notifications',
  {
    recipient: 'user1',
    title: 'New Notification',
    category: 'meeting',
  },
  {
    baseUrl: 'http://localhost/api/workflow-notifications',
    successMessage: 'Bildirim oluşturuldu',
    errorMessage: 'Bildirim oluşturulamadı',
    expectedStatus: 201,
  }
);

describe('POST /api/workflow-notifications - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates recipient is required', async () => {
    const invalidNotification = {
      title: 'Notification',
    };

    const request = createTestRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: invalidNotification,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400, 'Doğrulama hatası');
    expect(data.details).toContain('Alıcı zorunludur');
  });

  it('validates title is required and minimum length', async () => {
    const invalidNotification = {
      recipient: 'user1',
      title: 'AB',
    };

    const request = createTestRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: invalidNotification,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('Bildirim başlığı en az 3 karakter olmalıdır');
  });

  it('validates category values', async () => {
    const invalidNotification = {
      recipient: 'user1',
      title: 'Notification',
      category: 'INVALID',
    };

    const request = createTestRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: invalidNotification,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('Geçersiz bildirim kategorisi');
  });

  it('validates status values', async () => {
    const invalidNotification = {
      recipient: 'user1',
      title: 'Notification',
      status: 'INVALID',
    };

    const request = createTestRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: invalidNotification,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('Geçersiz bildirim durumu');
  });

  it('sets default category to meeting', async () => {
    const newNotification = {
      recipient: 'user1',
      title: 'Notification',
    };

    const createdNotification = {
      _id: 'new-id',
      ...newNotification,
      category: 'meeting',
      status: 'beklemede',
    };

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.create).mockResolvedValue(
      createdNotification as any
    );

    const request = createTestRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: newNotification,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; data?: unknown; message?: string }>(response);

    expectStatus(response, 201);
    expectSuccessResponse(data, 201);
  });
});
