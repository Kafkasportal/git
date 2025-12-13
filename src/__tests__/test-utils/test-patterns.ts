/**
 * Common Test Patterns
 * Reusable test patterns for API route testing to reduce duplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTestRequest,
  createTestParams,
  parseJsonResponse,
  expectSuccessResponse,
  expectErrorResponse,
  expectStatus,
  createMockListResponse,
} from './api-test-helpers';
import { createMockDocuments } from '../test-utils';

export interface TestRouteHandlers {
  GET?: (req: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>;
  POST?: (req: NextRequest) => Promise<NextResponse>;
  PUT?: (req: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>;
  PATCH?: (req: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>;
  DELETE?: (req: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>;
}

/**
 * Helper to run GET by ID tests
 */
export function runGetByIdTests(
  route: { GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse> },
  mockGet: (id: string) => Promise<unknown>,
  resourceName: string,
  options?: {
    baseUrl?: string;
    notFoundError?: string;
    errorMessage?: string;
  }
) {
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;
  const notFoundError = options?.notFoundError || `${resourceName} bulunamadı`;
  const errorMessage = options?.errorMessage || 'Veri alınamadı';

  describe(`GET /api/${resourceName}/[id]`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(`returns ${resourceName} by ID successfully`, async () => {
      const mockData = { _id: 'test-id', name: 'Test' };
      vi.mocked(mockGet).mockResolvedValue(mockData);

      const request = createTestRequest(`${baseUrl}/test-id`);
      const params = createTestParams({ id: 'test-id' });
      const response = await route.GET(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 200);
      expectSuccessResponse(data);
      expect(data.data).toEqual(mockData);
    });

    it(`returns 404 when ${resourceName} not found`, async () => {
      vi.mocked(mockGet).mockResolvedValue(null);

      const request = createTestRequest(`${baseUrl}/non-existent`);
      const params = createTestParams({ id: 'non-existent' });
      const response = await route.GET(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 404);
      expectErrorResponse(data, 404, notFoundError);
    });

    it('handles errors gracefully', async () => {
      vi.mocked(mockGet).mockRejectedValue(new Error('Database error'));

      const request = createTestRequest(`${baseUrl}/test-id`);
      const params = createTestParams({ id: 'test-id' });
      const response = await route.GET(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 500);
      expectErrorResponse(data, 500, errorMessage);
    });
  });
}

/**
 * Test GET by ID pattern - returns test cases array (deprecated, use runGetByIdTests)
 */
export function getGetByIdTests(
  route: { GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse> },
  mockGet: (id: string) => Promise<unknown>,
  resourceName: string,
  options?: {
    baseUrl?: string;
    notFoundError?: string;
    errorMessage?: string;
  }
) {
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;
  const notFoundError = options?.notFoundError || `${resourceName} bulunamadı`;
  const errorMessage = options?.errorMessage || 'Veri alınamadı';

  return {
    describe: `GET /api/${resourceName}/[id]`,
    tests: [
      {
        name: `returns ${resourceName} by ID successfully`,
        fn: async () => {
          const mockData = { _id: 'test-id', name: 'Test' };
          vi.mocked(mockGet).mockResolvedValue(mockData);

          const request = createTestRequest(`${baseUrl}/test-id`);
          const params = createTestParams({ id: 'test-id' });
          const response = await route.GET(request, { params });
          const data = await parseJsonResponse(response);

          expectStatus(response, 200);
          expectSuccessResponse(data);
          expect(data.data).toEqual(mockData);
        },
      },
      {
        name: `returns 404 when ${resourceName} not found`,
        fn: async () => {
          vi.mocked(mockGet).mockResolvedValue(null);

          const request = createTestRequest(`${baseUrl}/non-existent`);
          const params = createTestParams({ id: 'non-existent' });
          const response = await route.GET(request, { params });
          const data = await parseJsonResponse(response);

          expectStatus(response, 404);
          expectErrorResponse(data, 404, notFoundError);
        },
      },
      {
        name: 'handles errors gracefully',
        fn: async () => {
          vi.mocked(mockGet).mockRejectedValue(new Error('Database error'));

          const request = createTestRequest(`${baseUrl}/test-id`);
          const params = createTestParams({ id: 'test-id' });
          const response = await route.GET(request, { params });
          const data = await parseJsonResponse(response);

          expectStatus(response, 500);
          expectErrorResponse(data, 500, errorMessage);
        },
      },
    ],
  };
}

/**
 * Helper to run GET list tests
 */
export function runGetListTests(
  route: { GET: (req: NextRequest) => Promise<NextResponse> },
  mockList: (params?: unknown) => Promise<{ documents: unknown[]; total: number }>,
  resourceName: string,
  options?: {
    baseUrl?: string;
    errorMessage?: string;
  }
) {
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;
  const errorMessage = options?.errorMessage || `${resourceName} alınamadı`;

  describe(`GET /api/${resourceName}`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(`returns ${resourceName} list successfully`, async () => {
      const mockData = [
        { _id: '1', name: 'Item 1' },
        { _id: '2', name: 'Item 2' },
      ];
      const mockDocuments = createMockDocuments(mockData);
      vi.mocked(mockList).mockResolvedValue(createMockListResponse(mockDocuments, 2));

      const request = createTestRequest(baseUrl);
      const response = await route.GET(request);
      const data = await parseJsonResponse(response);

      expectStatus(response, 200);
      expectSuccessResponse(data);
      expect(data.data.documents || data.data).toEqual(mockDocuments);
    });

    it('handles empty list', async () => {
      vi.mocked(mockList).mockResolvedValue(createMockListResponse([], 0));

      const request = createTestRequest(baseUrl);
      const response = await route.GET(request);
      const data = await parseJsonResponse(response);

      expectStatus(response, 200);
      expectSuccessResponse(data);
      expect(data.data.documents || data.data).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      vi.mocked(mockList).mockRejectedValue(new Error('Database error'));

      const request = createTestRequest(baseUrl);
      const response = await route.GET(request);
      const data = await parseJsonResponse(response);

      expectStatus(response, 500);
      expectErrorResponse(data, 500, errorMessage);
    });
  });
}

/**
 * Helper to run POST create tests
 */
export function runCreateTests(
  route: { POST: (req: NextRequest) => Promise<NextResponse> },
  mockCreate: (data: unknown) => Promise<unknown>,
  resourceName: string,
  validData: Record<string, unknown>,
  options?: {
    baseUrl?: string;
    successMessage?: string;
    errorMessage?: string;
    expectedStatus?: number;
  }
) {
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;
  const successMessage = options?.successMessage || `${resourceName} oluşturuldu`;
  const errorMessage = options?.errorMessage || `${resourceName} oluşturulamadı`;
  const expectedStatus = options?.expectedStatus || 201;

  describe(`POST /api/${resourceName}`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(`creates ${resourceName} successfully`, async () => {
      const createdData = { _id: 'new-id', ...validData };
      vi.mocked(mockCreate).mockResolvedValue(createdData);

      const request = createTestRequest(baseUrl, {
        method: 'POST',
        body: validData,
      });
      const response = await route.POST(request);
      const data = await parseJsonResponse(response);

      expectStatus(response, expectedStatus);
      expectSuccessResponse(data, expectedStatus);
      expect(data.data).toEqual(createdData);
      if (data.message) {
        expect(data.message).toBe(successMessage);
      }
    });

    it('handles creation errors gracefully', async () => {
      vi.mocked(mockCreate).mockRejectedValue(new Error('Database error'));

      const request = createTestRequest(baseUrl, {
        method: 'POST',
        body: validData,
      });
      const response = await route.POST(request);
      const data = await parseJsonResponse(response);

      expectStatus(response, 500);
      expectErrorResponse(data, 500, errorMessage);
    });
  });
}

/**
 * Helper to run PATCH/PUT update tests
 */
export function runUpdateTests(
  route: { PATCH?: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse>; PUT?: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse> },
  mockUpdate: (id: string, data: unknown) => Promise<unknown>,
  resourceName: string,
  updateData: Record<string, unknown>,
  options?: {
    method?: 'PATCH' | 'PUT';
    baseUrl?: string;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const method = options?.method || 'PATCH';
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;
  const successMessage = options?.successMessage || `${resourceName} güncellendi`;
  const errorMessage = options?.errorMessage || `${resourceName} güncellenemedi`;
  const handler = route[method];

  if (!handler) {
    throw new Error(`Handler ${method} not found in route`);
  }

  describe(`${method} /api/${resourceName}/[id]`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(`updates ${resourceName} successfully`, async () => {
      const updatedData = { _id: 'test-id', ...updateData };
      vi.mocked(mockUpdate).mockResolvedValue(updatedData);

      const request = createTestRequest(`${baseUrl}/test-id`, {
        method,
        body: updateData,
      });
      const params = createTestParams({ id: 'test-id' });
      const response = await handler(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 200);
      expectSuccessResponse(data);
      if (data.message) {
        expect(data.message).toBe(successMessage);
      }
    });

    it('handles update errors gracefully', async () => {
      vi.mocked(mockUpdate).mockRejectedValue(new Error('Database error'));

      const request = createTestRequest(`${baseUrl}/test-id`, {
        method,
        body: updateData,
      });
      const params = createTestParams({ id: 'test-id' });
      const response = await handler(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 500);
      expectErrorResponse(data, 500, errorMessage);
    });
  });
}

/**
 * Helper to run DELETE tests
 */
export function runDeleteTests(
  route: { DELETE: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<NextResponse> },
  mockDelete: (id: string) => Promise<void>,
  resourceName: string,
  options?: {
    baseUrl?: string;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;
  const successMessage = options?.successMessage || `${resourceName} silindi`;
  const errorMessage = options?.errorMessage || `${resourceName} silinemedi`;

  describe(`DELETE /api/${resourceName}/[id]`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(`deletes ${resourceName} successfully`, async () => {
      vi.mocked(mockDelete).mockResolvedValue(undefined);

      const request = createTestRequest(`${baseUrl}/test-id`, {
        method: 'DELETE',
      });
      const params = createTestParams({ id: 'test-id' });
      const response = await route.DELETE(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 200);
      expectSuccessResponse(data);
      if (data.message) {
        expect(data.message).toBe(successMessage);
      }
    });

    it('handles delete errors gracefully', async () => {
      vi.mocked(mockDelete).mockRejectedValue(new Error('Database error'));

      const request = createTestRequest(`${baseUrl}/test-id`, {
        method: 'DELETE',
      });
      const params = createTestParams({ id: 'test-id' });
      const response = await route.DELETE(request, { params });
      const data = await parseJsonResponse(response);

      expectStatus(response, 500);
      expectErrorResponse(data, 500, errorMessage);
    });
  });
}

/**
 * Helper to run filtering tests
 */
export function runFilteringTests(
  route: { GET: (req: NextRequest) => Promise<NextResponse> },
  mockList: (params?: unknown) => Promise<{ documents: unknown[]; total: number }>,
  resourceName: string,
  filterTests: Array<{
    name: string;
    queryParams: Record<string, string>;
    expectedFilter: unknown;
  }>,
  options?: {
    baseUrl?: string;
  }
) {
  const baseUrl = options?.baseUrl || `http://localhost/api/${resourceName}`;

  describe(`GET /api/${resourceName} - Filtering`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    filterTests.forEach(({ name, queryParams, expectedFilter }) => {
      it(`filters by ${name}`, async () => {
        const mockData = [{ _id: '1', ...expectedFilter }];
        const mockDocuments = createMockDocuments(mockData);
        vi.mocked(mockList).mockResolvedValue(createMockListResponse(mockDocuments, 1));

        const queryString = new URLSearchParams(queryParams).toString();
        const request = createTestRequest(`${baseUrl}?${queryString}`);
        const response = await route.GET(request);

        expectStatus(response, 200);
        expect(vi.mocked(mockList)).toHaveBeenCalledWith(
          expect.objectContaining(expectedFilter)
        );
      });
    });
  });
}

