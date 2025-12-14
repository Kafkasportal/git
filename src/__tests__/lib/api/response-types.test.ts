/**
 * Response Types Tests
 */

import { describe, it, expect } from 'vitest';
import {
    isApiSuccess,
    isApiError,
    isPaginatedResponse,
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    calculatePagination,
    getDefaultPaginationParams,
    errorCodeToStatus,
} from '@/lib/api/response-types';

describe('Response Types', () => {
    describe('isApiSuccess', () => {
        it('should return true for success response', () => {
            const response = { success: true as const, data: { id: '1' } };
            expect(isApiSuccess(response)).toBe(true);
        });

        it('should return false for error response', () => {
            const response = {
                success: false as const,
                error: { code: 'NOT_FOUND' as const, message: 'Not found' },
            };
            expect(isApiSuccess(response)).toBe(false);
        });
    });

    describe('isApiError', () => {
        it('should return true for error response', () => {
            const response = {
                success: false as const,
                error: { code: 'NOT_FOUND' as const, message: 'Not found' },
            };
            expect(isApiError(response)).toBe(true);
        });

        it('should return false for success response', () => {
            const response = { success: true as const, data: { id: '1' } };
            expect(isApiError(response)).toBe(false);
        });
    });

    describe('isPaginatedResponse', () => {
        it('should return true for paginated response', () => {
            const response = {
                success: true as const,
                data: [{ id: '1' }],
                pagination: {
                    page: 1,
                    pageSize: 10,
                    totalItems: 100,
                    totalPages: 10,
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startIndex: 0,
                    endIndex: 9,
                },
            };
            expect(isPaginatedResponse(response)).toBe(true);
        });

        it('should return false for non-paginated response', () => {
            const response = { success: true as const, data: [{ id: '1' }] };
            expect(isPaginatedResponse(response)).toBe(false);
        });

        it('should return false for error response', () => {
            const response = {
                success: false as const,
                error: { code: 'NOT_FOUND' as const, message: 'Not found' },
            };
            expect(isPaginatedResponse(response)).toBe(false);
        });
    });

    describe('createSuccessResponse', () => {
        it('should create success response with data', () => {
            const data = { id: '1', name: 'Test' };
            const response = createSuccessResponse(data);

            expect(response.success).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.meta?.timestamp).toBeDefined();
        });

        it('should create success response with message', () => {
            const response = createSuccessResponse({ id: '1' }, 'Created successfully');

            expect(response.message).toBe('Created successfully');
        });

        it('should create success response with custom meta', () => {
            const response = createSuccessResponse(
                { id: '1' },
                undefined,
                { requestId: 'req-123', duration: 50 }
            );

            expect(response.meta?.requestId).toBe('req-123');
            expect(response.meta?.duration).toBe(50);
        });
    });

    describe('createErrorResponse', () => {
        it('should create error response', () => {
            const response = createErrorResponse('NOT_FOUND', 'Resource not found');

            expect(response.success).toBe(false);
            expect(response.error.code).toBe('NOT_FOUND');
            expect(response.error.message).toBe('Resource not found');
            expect(response.meta?.timestamp).toBeDefined();
        });

        it('should create error response with details', () => {
            const response = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid input',
                { field: 'email', reason: 'Invalid format' }
            );

            expect(response.error.details).toEqual({
                field: 'email',
                reason: 'Invalid format',
            });
        });
    });

    describe('createPaginatedResponse', () => {
        it('should create paginated response', () => {
            const data = [{ id: '1' }, { id: '2' }];
            const pagination = {
                page: 1,
                pageSize: 10,
                totalItems: 100,
                totalPages: 10,
                hasNextPage: true,
                hasPreviousPage: false,
                startIndex: 0,
                endIndex: 9,
            };

            const response = createPaginatedResponse(data, pagination);

            expect(response.success).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.pagination).toEqual(pagination);
        });

        it('should create paginated response with sort and filters', () => {
            const data = [{ id: '1' }];
            const pagination = {
                page: 1,
                pageSize: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                startIndex: 0,
                endIndex: 0,
            };

            const response = createPaginatedResponse(data, pagination, {
                sort: { field: 'name', direction: 'asc' },
                filters: { applied: { status: 'active' }, available: ['status', 'type'] },
                message: 'Found 1 result',
            });

            expect(response.sort?.field).toBe('name');
            expect(response.filters?.applied).toEqual({ status: 'active' });
            expect(response.message).toBe('Found 1 result');
        });
    });

    describe('calculatePagination', () => {
        it('should calculate pagination for first page', () => {
            const result = calculatePagination(1, 10, 100);

            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(10);
            expect(result.totalItems).toBe(100);
            expect(result.totalPages).toBe(10);
            expect(result.hasNextPage).toBe(true);
            expect(result.hasPreviousPage).toBe(false);
            expect(result.startIndex).toBe(0);
            expect(result.endIndex).toBe(9);
        });

        it('should calculate pagination for middle page', () => {
            const result = calculatePagination(5, 10, 100);

            expect(result.page).toBe(5);
            expect(result.hasNextPage).toBe(true);
            expect(result.hasPreviousPage).toBe(true);
            expect(result.startIndex).toBe(40);
            expect(result.endIndex).toBe(49);
        });

        it('should calculate pagination for last page', () => {
            const result = calculatePagination(10, 10, 100);

            expect(result.page).toBe(10);
            expect(result.hasNextPage).toBe(false);
            expect(result.hasPreviousPage).toBe(true);
            expect(result.startIndex).toBe(90);
            expect(result.endIndex).toBe(99);
        });

        it('should handle partial last page', () => {
            const result = calculatePagination(3, 10, 25);

            expect(result.totalPages).toBe(3);
            expect(result.hasNextPage).toBe(false);
            expect(result.startIndex).toBe(20);
            expect(result.endIndex).toBe(24);
        });

        it('should handle empty results', () => {
            const result = calculatePagination(1, 10, 0);

            expect(result.totalPages).toBe(0);
            expect(result.hasNextPage).toBe(false);
            expect(result.hasPreviousPage).toBe(false);
            expect(result.startIndex).toBe(0);
            expect(result.endIndex).toBe(-1);
        });
    });

    describe('getDefaultPaginationParams', () => {
        it('should return default values when no params', () => {
            const query = new URLSearchParams();
            const result = getDefaultPaginationParams(query);

            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(25);
        });

        it('should parse page and pageSize from query', () => {
            const query = new URLSearchParams('page=3&pageSize=50');
            const result = getDefaultPaginationParams(query);

            expect(result.page).toBe(3);
            expect(result.pageSize).toBe(50);
        });

        it('should enforce minimum page of 1', () => {
            const query = new URLSearchParams('page=0');
            const result = getDefaultPaginationParams(query);

            expect(result.page).toBe(1);
        });

        it('should enforce minimum pageSize of 1', () => {
            const query = new URLSearchParams('pageSize=0');
            const result = getDefaultPaginationParams(query);

            expect(result.pageSize).toBe(1);
        });

        it('should enforce maximum pageSize of 100', () => {
            const query = new URLSearchParams('pageSize=500');
            const result = getDefaultPaginationParams(query);

            expect(result.pageSize).toBe(100);
        });
    });

    describe('errorCodeToStatus', () => {
        it('should map error codes to HTTP status codes', () => {
            expect(errorCodeToStatus.VALIDATION_ERROR).toBe(400);
            expect(errorCodeToStatus.BAD_REQUEST).toBe(400);
            expect(errorCodeToStatus.AUTHENTICATION_ERROR).toBe(401);
            expect(errorCodeToStatus.SESSION_EXPIRED).toBe(401);
            expect(errorCodeToStatus.CSRF_ERROR).toBe(403);
            expect(errorCodeToStatus.AUTHORIZATION_ERROR).toBe(403);
            expect(errorCodeToStatus.NOT_FOUND).toBe(404);
            expect(errorCodeToStatus.CONFLICT).toBe(409);
            expect(errorCodeToStatus.RATE_LIMIT_EXCEEDED).toBe(429);
            expect(errorCodeToStatus.INTERNAL_ERROR).toBe(500);
            expect(errorCodeToStatus.SERVICE_UNAVAILABLE).toBe(503);
            expect(errorCodeToStatus.NETWORK_ERROR).toBe(502);
            expect(errorCodeToStatus.TIMEOUT).toBe(504);
        });
    });
});
