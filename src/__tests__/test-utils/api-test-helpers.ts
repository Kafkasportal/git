/**
 * API Test Helper Utilities
 * Common utilities for API route testing to reduce duplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { expect } from 'vitest';

/**
 * Create a test NextRequest
 */
export function createTestRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): NextRequest {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options?.headers,
  });

  return new NextRequest(url, {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Create test route params (for dynamic routes)
 */
export function createTestParams<T extends Record<string, string>>(
  params: T
): Promise<T> {
  return Promise.resolve(params);
}

/**
 * Parse JSON response
 */
export async function parseJsonResponse<T = unknown>(
  response: NextResponse
): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Assert success response
 */
export function expectSuccessResponse(
  data: { success?: boolean; data?: unknown; message?: string },
  expectedStatus: number = 200
): void {
  expect(data.success).toBe(true);
  if (expectedStatus !== 200) {
    // Status check would be done separately on response object
  }
}

/**
 * Assert error response
 */
export function expectErrorResponse(
  data: { success?: boolean; error?: string; details?: string[] },
  expectedStatus: number = 400,
  errorMessage?: string
): void {
  expect(data.success).toBe(false);
  if (errorMessage) {
    expect(data.error).toBe(errorMessage);
  }
  if (expectedStatus !== 400) {
    // Status check would be done separately on response object
  }
}

/**
 * Assert response status
 */
export function expectStatus(response: NextResponse, expectedStatus: number): void {
  expect(response.status).toBe(expectedStatus);
}

/**
 * Create mock list response
 */
export function createMockListResponse<T>(
  documents: T[],
  total?: number
): { documents: T[]; total: number } {
  return {
    documents,
    total: total ?? documents.length,
  };
}

/**
 * Create mock pagination params
 */
export function createPaginationParams(page: number = 1, limit: number = 50): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  return params;
}

