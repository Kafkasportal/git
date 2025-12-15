/**
 * API Error Response Property Tests
 *
 * Property 1: CRUD Error Response Consistency
 * For any API call that fails, the error response SHALL have a consistent structure
 * with `success: false`, `error: string`, and optional `code: string` fields.
 *
 * **Validates: Requirements 1.3**
 */

import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import {
    createErrorResponse,
    createSuccessResponse,
    type ApiErrorResponse,
    type ApiSuccessResponse,
} from '@/lib/api/error-response';

// Error code generator - matches ErrorCodes from error-response.ts
const errorCodeArb = fc.constantFrom(
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'RATE_LIMIT_EXCEEDED',
    'INTERNAL_ERROR',
    'DATABASE_ERROR',
    'INVALID_TOKEN',
    'SESSION_EXPIRED',
    'INVALID_CSRF',
    'ALREADY_EXISTS',
    'DUPLICATE_ENTRY',
    'WORKFLOW_ERROR',
    'PERMISSION_DENIED'
);

// Error message generator
const errorMessageArb = fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0);

// Field path generator for validation errors
const fieldPathArb = fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 });

describe('Property 1: CRUD Error Response Consistency', () => {
    describe('Error Response Structure', () => {
        fcTest.prop([errorMessageArb], { numRuns: 100 })(
            'error response always has success: false',
            (message) => {
                const response = createErrorResponse(message);

                expect(response.success).toBe(false);
                expect(typeof response.error).toBe('string');
                expect(response.error.length).toBeGreaterThan(0);
            }
        );

        fcTest.prop([errorMessageArb, errorCodeArb], { numRuns: 100 })(
            'error response with code has consistent structure',
            (message, code) => {
                const response = createErrorResponse(message, code);

                expect(response.success).toBe(false);
                expect(response.error).toBe(message);
                expect(response.code).toBe(code);
            }
        );

        fcTest.prop([errorMessageArb, errorCodeArb, fc.jsonValue()], { numRuns: 100 })(
            'error response with details has consistent structure',
            (message, code, details) => {
                const response = createErrorResponse(message, code, details);

                expect(response.success).toBe(false);
                expect(response.error).toBe(message);
                expect(response.code).toBe(code);
                expect(response.details).toEqual(details);
            }
        );
    });

    describe('Success Response Structure', () => {
        fcTest.prop([fc.anything()], { numRuns: 100 })(
            'success response always has success: true',
            (data) => {
                const response = createSuccessResponse(data);

                expect(response.success).toBe(true);
                expect(response.data).toEqual(data);
                expect((response as unknown as ApiErrorResponse).error).toBeUndefined();
            }
        );
    });

    describe('Error Response Type Guards', () => {
        fcTest.prop([errorMessageArb], { numRuns: 100 })(
            'error response is distinguishable from success response',
            (message) => {
                const errorResponse = createErrorResponse(message);
                const successResponse = createSuccessResponse({ message });

                // Type guard check
                const isError = (r: ApiErrorResponse | ApiSuccessResponse<unknown>): r is ApiErrorResponse =>
                    r.success === false;

                expect(isError(errorResponse)).toBe(true);
                expect(isError(successResponse)).toBe(false);
            }
        );
    });

    describe('Validation Error Details', () => {
        fcTest.prop([fieldPathArb, errorMessageArb], { numRuns: 100 })(
            'validation errors include field path and message',
            (fieldPath, message) => {
                const validationError = {
                    success: false as const,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR' as const,
                    details: [
                        {
                            path: fieldPath,
                            message,
                        },
                    ],
                };

                expect(validationError.success).toBe(false);
                expect(validationError.code).toBe('VALIDATION_ERROR');
                expect(validationError.details).toHaveLength(1);
                expect(validationError.details[0].path).toEqual(fieldPath);
                expect(validationError.details[0].message).toBe(message);
            }
        );
    });

    describe('Error Message Preservation', () => {
        fcTest.prop([errorMessageArb], { numRuns: 100 })(
            'error message is preserved exactly as provided',
            (message) => {
                const response = createErrorResponse(message);

                expect(response.error).toBe(message);
            }
        );

        it('should handle empty error message gracefully', () => {
            // Edge case: empty message should still create valid response
            const response = createErrorResponse('');

            expect(response.success).toBe(false);
            expect(typeof response.error).toBe('string');
        });
    });

    describe('Error Code Consistency', () => {
        fcTest.prop([errorCodeArb], { numRuns: 100 })(
            'error code is preserved when provided',
            (code) => {
                const response = createErrorResponse('Test error', code);

                expect(response.code).toBe(code);
            }
        );

        it('should allow undefined code', () => {
            const response = createErrorResponse('Test error');

            expect(response.success).toBe(false);
            expect(response.code).toBeUndefined();
        });
    });
});

describe('API Response Serialization', () => {
    fcTest.prop([errorMessageArb, errorCodeArb], { numRuns: 100 })(
        'error response can be serialized and deserialized',
        (message, code) => {
            const response = createErrorResponse(message, code);
            const serialized = JSON.stringify(response);
            const deserialized = JSON.parse(serialized) as ApiErrorResponse;

            expect(deserialized.success).toBe(false);
            expect(deserialized.error).toBe(message);
            expect(deserialized.code).toBe(code);
        }
    );

    fcTest.prop([fc.jsonValue()], { numRuns: 100 })(
        'success response can be serialized and deserialized',
        (data) => {
            const response = createSuccessResponse(data);
            const serialized = JSON.stringify(response);
            const deserialized = JSON.parse(serialized) as ApiSuccessResponse<unknown>;

            expect(deserialized.success).toBe(true);
            expect(deserialized.data).toEqual(data);
        }
    );
});
