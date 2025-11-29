import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments, createMockDocument } from '../test-utils';
import { GET, POST } from '@/app/api/finance/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteFinanceRecords: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
  })),
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db',
    collections: {
      financeRecords: 'finance_records',
    },
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn((handler) => handler),
  dataModificationRateLimit: vi.fn((handler) => handler),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  parseBody: vi.fn(async (request) => {
    const body = await request.json();
    return { data: body, error: null };
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/finance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns finance records list successfully', async () => {
    const mockRecords = createMockDocuments([
      {
        _id: '1',
        record_type: 'income',
        amount: 1000,
        category: 'Bağış',
        currency: 'TRY',
        description: 'Test income',
        transaction_date: '2024-01-01T00:00:00Z',
        created_by: 'user1',
        status: 'approved',
      },
      {
        _id: '2',
        record_type: 'expense',
        amount: 500,
        category: 'Gider',
        currency: 'TRY',
        description: 'Test expense',
        transaction_date: '2024-01-02T00:00:00Z',
        created_by: 'user1',
        status: 'pending',
      },
    ]);

    vi.mocked(appwriteApi.appwriteFinanceRecords.list).mockResolvedValue({
      documents: mockRecords,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/finance');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockRecords);
    expect(data.total).toBe(2);
  });

  it('filters by record_type', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.list).mockResolvedValue({
      documents: [
        createMockDocument({
          _id: '1',
          record_type: 'income',
          amount: 1000,
          category: 'Bağış',
        }),
      ],
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/finance?record_type=income');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteFinanceRecords.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        record_type: 'income',
      })
    );
  });

  it('filters by created_by', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance?created_by=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteFinanceRecords.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by: 'user1',
      })
    );
  });

  it('handles pagination parameters', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteFinanceRecords.list)).toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.list).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/finance');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Finans kayıtları alınamadı');
  });
});

describe('POST /api/finance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates finance record successfully', async () => {
    const newRecord = {
      record_type: 'income' as const,
      category: 'Bağış',
      amount: 1000,
      currency: 'TRY' as const,
      description: 'Test donation',
      transaction_date: '2024-01-01T00:00:00Z',
      created_by: 'user1',
      status: 'pending' as const,
    };

    const createdRecord = {
      _id: 'new-id',
      ...newRecord,
    };

    vi.mocked(appwriteApi.appwriteFinanceRecords.create).mockResolvedValue(createdRecord);

    const request = new NextRequest('http://localhost/api/finance', {
      method: 'POST',
      body: JSON.stringify(newRecord),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdRecord);
    expect(data.message).toBe('Finans kaydı başarıyla oluşturuldu');
  });

  it('validates required fields', async () => {
    const invalidRecord = {
      record_type: 'income',
      // Missing required fields
    };

    const request = new NextRequest('http://localhost/api/finance', {
      method: 'POST',
      body: JSON.stringify(invalidRecord),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates amount is positive', async () => {
    const invalidRecord = {
      record_type: 'income',
      category: 'Test',
      amount: -100, // Negative amount
      currency: 'TRY',
      description: 'Test',
      transaction_date: '2024-01-01T00:00:00Z',
      created_by: 'user1',
    };

    const request = new NextRequest('http://localhost/api/finance', {
      method: 'POST',
      body: JSON.stringify(invalidRecord),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates transaction_date is not in future', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const invalidRecord = {
      record_type: 'income',
      category: 'Test',
      amount: 1000,
      currency: 'TRY',
      description: 'Test',
      transaction_date: futureDate.toISOString(),
      created_by: 'user1',
    };

    const request = new NextRequest('http://localhost/api/finance', {
      method: 'POST',
      body: JSON.stringify(invalidRecord),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.create).mockRejectedValue(
      new Error('Database error')
    );

    const validRecord = {
      record_type: 'income',
      category: 'Test',
      amount: 1000,
      currency: 'TRY',
      description: 'Test description',
      transaction_date: '2024-01-01T00:00:00Z',
      created_by: 'user1',
    };

    const request = new NextRequest('http://localhost/api/finance', {
      method: 'POST',
      body: JSON.stringify(validRecord),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Finans kaydı oluşturma işlemi başarısız');
  });
});
