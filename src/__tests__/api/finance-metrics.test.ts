import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/finance/metrics/route';
import { NextRequest } from 'next/server';

// Mock Appwrite
const mockListDocuments = vi.fn();
vi.mock('@/lib/appwrite/server', () => ({
  getServerDatabases: vi.fn(() => ({
    listDocuments: mockListDocuments,
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
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn((handler) => handler),
}));

describe('GET /api/finance/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns aggregated metrics successfully', async () => {
    // Mock finance records
    mockListDocuments.mockResolvedValue({
      documents: [
        { amount: 1000, record_type: 'income' },
        { amount: 500, record_type: 'income' },
        { amount: 300, record_type: 'expense' },
        { amount: 200, record_type: 'expense' },
      ],
      total: 4,
    });

    const request = new NextRequest('http://localhost/api/finance/metrics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('totalIncome', 1500);
    expect(data.data).toHaveProperty('totalExpenses', 500);
    expect(data.data).toHaveProperty('netIncome', 1000);
    expect(data.data).toHaveProperty('recordCount', 4);
  });

  it('handles date range filters', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [{ amount: 1000, record_type: 'income' }],
      total: 1,
    });

    const request = new NextRequest(
      'http://localhost/api/finance/metrics?from=2024-01-01&to=2024-12-31'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockListDocuments).toHaveBeenCalledWith(
      'test-db',
      'finance_records',
      expect.arrayContaining([
        expect.stringContaining('greaterThanEqual'),
        expect.stringContaining('lessThanEqual'),
      ])
    );
  });

  it('handles payment method filter', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance/metrics?payment_method=card');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockListDocuments).toHaveBeenCalledWith(
      'test-db',
      'finance_records',
      expect.arrayContaining([expect.stringContaining('equal')])
    );
  });

  it('returns zero values when no records found', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance/metrics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.totalIncome).toBe(0);
    expect(data.data.totalExpenses).toBe(0);
    expect(data.data.netIncome).toBe(0);
    expect(data.data.recordCount).toBe(0);
  });

  it('handles records with missing amount gracefully', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [
        { amount: 1000, record_type: 'income' },
        { record_type: 'income' }, // Missing amount
        { amount: undefined, record_type: 'expense' },
      ],
      total: 3,
    });

    const request = new NextRequest('http://localhost/api/finance/metrics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.totalIncome).toBe(1000);
    expect(data.data.totalExpenses).toBe(0);
  });

  it('includes cache headers in response', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance/metrics');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBeTruthy();
  });
});
