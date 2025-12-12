import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/aid-applications/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteAidApplications: {
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

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['beneficiaries:read'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
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

describe('GET /api/aid-applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns aid applications list successfully', async () => {
    const mockApplicationsData = [
      {
        _id: '1',
        applicant_name: 'Test Applicant 1',
        application_date: '2024-01-01',
        stage: 'draft',
        status: 'open',
      },
      {
        _id: '2',
        applicant_name: 'Test Applicant 2',
        application_date: '2024-01-02',
        stage: 'approved',
        status: 'open',
      },
    ];
    const mockApplications = createMockDocuments(mockApplicationsData);

    vi.mocked(appwriteApi.appwriteAidApplications.list).mockResolvedValue({
      documents: mockApplications,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/aid-applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockApplications);
    expect(data.total).toBe(2);
  });

  it('filters by stage', async () => {
    const mockApplications = createMockDocuments([
      {
        _id: '1',
        applicant_name: 'Test Applicant',
        stage: 'draft',
      },
    ]);

    vi.mocked(appwriteApi.appwriteAidApplications.list).mockResolvedValue({
      documents: mockApplications,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/aid-applications?stage=draft');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteAidApplications.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'draft',
      })
    );
  });

  it('filters by beneficiary_id', async () => {
    const mockApplications = createMockDocuments([
      {
        _id: '1',
        applicant_name: 'Test Applicant',
        beneficiary_id: 'beneficiary-1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteAidApplications.list).mockResolvedValue({
      documents: mockApplications,
      total: 1,
    });

    const request = new NextRequest(
      'http://localhost/api/aid-applications?beneficiary_id=beneficiary-1'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteAidApplications.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiary_id: 'beneficiary-1',
      })
    );
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/aid-applications?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteAidApplications.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/aid-applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteAidApplications.list).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/aid-applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Veri alınamadı');
  });
});

describe('POST /api/aid-applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates aid application successfully', async () => {
    const newApplication = {
      applicant_name: 'Test Applicant',
      application_date: '2024-01-01',
      stage: 'draft',
      status: 'open',
      applicant_type: 'person',
    };

    const createdApplication = {
      _id: 'new-id',
      ...newApplication,
    };

    vi.mocked(appwriteApi.appwriteAidApplications.create).mockResolvedValue(
      createdApplication as unknown
    );

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(newApplication),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdApplication);
    expect(data.message).toBe('Başvuru oluşturuldu');
  });

  it('validates applicant_name is required and minimum length', async () => {
    const invalidApplication = {
      applicant_name: 'A', // Too short
      application_date: '2024-01-01',
      stage: 'draft',
      status: 'open',
    };

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(invalidApplication),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Başvuru sahibi adı zorunludur');
  });

  it('validates application_date is required', async () => {
    const invalidApplication = {
      applicant_name: 'Test Applicant',
      // Missing application_date
      stage: 'draft',
      status: 'open',
    };

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(invalidApplication),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Başvuru tarihi zorunludur');
  });

  it('validates stage is required and valid', async () => {
    const invalidApplication = {
      applicant_name: 'Test Applicant',
      application_date: '2024-01-01',
      stage: 'INVALID', // Invalid stage
      status: 'open',
    };

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(invalidApplication),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz aşama');
  });

  it('validates status is required and valid', async () => {
    const invalidApplication = {
      applicant_name: 'Test Applicant',
      application_date: '2024-01-01',
      stage: 'draft',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(invalidApplication),
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

  it('sets default values correctly', async () => {
    const newApplication = {
      applicant_name: 'Test Applicant',
      application_date: '2024-01-01',
      stage: 'draft',
      status: 'open',
      // No applicant_type provided
    };

    const createdApplication = {
      _id: 'new-id',
      ...newApplication,
      applicant_type: 'person', // Default value
    };

    vi.mocked(appwriteApi.appwriteAidApplications.create).mockResolvedValue(
      createdApplication as unknown
    );

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(newApplication),
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
    vi.mocked(appwriteApi.appwriteAidApplications.create).mockRejectedValue(
      new Error('Database error')
    );

    const validApplication = {
      applicant_name: 'Test Applicant',
      application_date: '2024-01-01',
      stage: 'draft',
      status: 'open',
    };

    const request = new NextRequest('http://localhost/api/aid-applications', {
      method: 'POST',
      body: JSON.stringify(validApplication),
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
