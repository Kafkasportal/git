import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/finance/monthly/route';
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

describe('GET /api/finance/monthly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns monthly trends and categories successfully', async () => {
    // Mock finance records with different months
    mockListDocuments.mockResolvedValue({
      documents: [
        {
          amount: 1000,
          record_type: 'income',
          transaction_date: '2024-01-15T00:00:00Z',
          category: 'Bağış',
        },
        {
          amount: 500,
          record_type: 'income',
          transaction_date: '2024-01-20T00:00:00Z',
          category: 'Bağış',
        },
        {
          amount: 300,
          record_type: 'expense',
          transaction_date: '2024-01-10T00:00:00Z',
          category: 'Gider',
        },
        {
          amount: 200,
          record_type: 'expense',
          transaction_date: '2024-02-05T00:00:00Z',
          category: 'Gider',
        },
      ],
      total: 4,
    });

    const request = new NextRequest('http://localhost/api/finance/monthly');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('trends');
    expect(data.data).toHaveProperty('categories');

    // Check trends
    const trends = data.data.trends;
    expect(Array.isArray(trends)).toBe(true);
    expect(trends.length).toBeGreaterThan(0);

    // Find January trend
    const janTrend = trends.find((t: { date: string }) => t.date === '2024-01');
    expect(janTrend).toBeDefined();
    expect(janTrend.income).toBe(1500);
    expect(janTrend.expense).toBe(300);

    // Check categories
    expect(data.data.categories.income).toHaveProperty('Bağış', 1500);
    expect(data.data.categories.expense).toHaveProperty('Gider', 500);
  });

  it('sorts trends by date chronologically', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [
        {
          amount: 100,
          record_type: 'income',
          transaction_date: '2024-03-15T00:00:00Z',
          category: 'Test',
        },
        {
          amount: 200,
          record_type: 'income',
          transaction_date: '2024-01-15T00:00:00Z',
          category: 'Test',
        },
        {
          amount: 300,
          record_type: 'income',
          transaction_date: '2024-02-15T00:00:00Z',
          category: 'Test',
        },
      ],
      total: 3,
    });

    const request = new NextRequest('http://localhost/api/finance/monthly');
    const response = await GET(request);
    const data = await response.json();

    const trends = data.data.trends;
    expect(trends[0].date).toBe('2024-01');
    expect(trends[1].date).toBe('2024-02');
    expect(trends[2].date).toBe('2024-03');
  });

  it('handles records with missing category', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [
        {
          amount: 1000,
          record_type: 'income',
          transaction_date: '2024-01-15T00:00:00Z',
          // Missing category
        },
      ],
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/finance/monthly');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.categories.income).toHaveProperty('Diğer', 1000);
  });

  it('handles date range filters', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest(
      'http://localhost/api/finance/monthly?from=2024-01-01&to=2024-12-31'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockListDocuments).toHaveBeenCalledWith(
      'test-db',
      'finance_records',
      expect.arrayContaining([
        expect.stringContaining('greaterThanEqual'),
        expect.stringContaining('lessThanEqual'),
      ])
    );
  });

  it('returns empty arrays when no records found', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance/monthly');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.trends).toEqual([]);
    expect(data.data.categories.income).toEqual({});
    expect(data.data.categories.expense).toEqual({});
  });

  it('includes cache headers in response', async () => {
    mockListDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/finance/monthly');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBeTruthy();
  });
});
