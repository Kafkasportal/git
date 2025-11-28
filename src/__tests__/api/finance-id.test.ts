import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/finance/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteFinanceRecords: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
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

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  extractParams: vi.fn(async (params) => {
    const resolved = await params;
    return resolved;
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/finance/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns finance record by ID successfully', async () => {
    const mockRecord = {
      _id: 'test-id',
      record_type: 'income',
      amount: 1000,
      category: 'Bağış',
      currency: 'TRY',
      description: 'Test record',
      transaction_date: '2024-01-01T00:00:00Z',
      created_by: 'user1',
      status: 'approved',
    };

    vi.mocked(appwriteApi.appwriteFinanceRecords.get).mockResolvedValue(mockRecord);

    const request = new NextRequest('http://localhost/api/finance/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockRecord);
  });

  it('returns 404 when record not found', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/finance/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Finans kaydı bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.get).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/finance/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Finans kaydı alınamadı');
  });
});

describe('PUT /api/finance/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates finance record successfully', async () => {
    const updateData = {
      amount: 2000,
      description: 'Updated description',
    };

    const updatedRecord = {
      _id: 'test-id',
      record_type: 'income',
      amount: 2000,
      category: 'Bağış',
      currency: 'TRY',
      description: 'Updated description',
      transaction_date: '2024-01-01T00:00:00Z',
      created_by: 'user1',
      status: 'approved',
    };

    vi.mocked(appwriteApi.appwriteFinanceRecords.update).mockResolvedValue(updatedRecord);

    const request = new NextRequest('http://localhost/api/finance/test-id', {
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
    expect(data.data).toEqual(updatedRecord);
    expect(data.message).toBe('Finans kaydı başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      amount: -100, // Invalid: negative amount
    };

    const request = new NextRequest('http://localhost/api/finance/test-id', {
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

  it('returns 404 when record not found', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      amount: 2000,
    };

    const request = new NextRequest('http://localhost/api/finance/non-existent', {
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
    expect(data.error).toBe('Finans kaydı bulunamadı');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.update).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      amount: 2000,
    };

    const request = new NextRequest('http://localhost/api/finance/test-id', {
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

describe('DELETE /api/finance/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes finance record successfully', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/finance/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Finans kaydı başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteFinanceRecords.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when record not found', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/finance/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Finans kaydı bulunamadı');
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteFinanceRecords.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/finance/test-id', {
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
