/**
 * Error Response Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
    createErrorResponse,
    createSuccessResponse,
    CommonErrors,
    normalizeError,
    isApiErrorResponse,
    isApiSuccessResponse,
    getStatusCodeForError,
    ErrorCodes,
} from '@/lib/api/error-response';

describe('Error Response Utilities', () => {
    describe('createErrorResponse', () => {
        it('should create error response with all fields', () => {
            const response = createErrorResponse('Test error', ErrorCodes.VALIDATION_ERROR, { field: 'name' });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Test error');
            expect(response.code).toBe('VALIDATION_ERROR');
            expect(response.details).toEqual({ field: 'name' });
            expect(response.timestamp).toBeDefined();
        });

        it('should create error response without optional fields', () => {
            const response = createErrorResponse('Simple error');

            expect(response.success).toBe(false);
            expect(response.error).toBe('Simple error');
            expect(response.code).toBeUndefined();
            expect(response.details).toBeUndefined();
        });
    });

    describe('createSuccessResponse', () => {
        it('should create success response with data', () => {
            const data = { id: '1', name: 'Test' };
            const response = createSuccessResponse(data);

            expect(response.success).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.timestamp).toBeDefined();
        });

        it('should create success response with message', () => {
            const response = createSuccessResponse({ id: '1' }, 'Created successfully');

            expect(response.success).toBe(true);
            expect(response.message).toBe('Created successfully');
        });
    });

    describe('CommonErrors', () => {
        it('should create unauthorized error', () => {
            const error = CommonErrors.unauthorized();

            expect(error.success).toBe(false);
            expect(error.error).toBe('Yetkilendirme gerekli');
            expect(error.code).toBe('UNAUTHORIZED');
        });

        it('should create forbidden error with default message', () => {
            const error = CommonErrors.forbidden();

            expect(error.error).toBe('Bu işlem için yetkiniz bulunmuyor');
            expect(error.code).toBe('FORBIDDEN');
        });

        it('should create forbidden error with custom reason', () => {
            const error = CommonErrors.forbidden('Admin yetkisi gerekli');

            expect(error.error).toBe('Admin yetkisi gerekli');
        });

        it('should create notFound error with default resource', () => {
            const error = CommonErrors.notFound();

            expect(error.error).toBe('Kayıt bulunamadı');
            expect(error.code).toBe('NOT_FOUND');
        });

        it('should create notFound error with custom resource', () => {
            const error = CommonErrors.notFound('Kullanıcı');

            expect(error.error).toBe('Kullanıcı bulunamadı');
        });

        it('should create alreadyExists error', () => {
            const error = CommonErrors.alreadyExists('E-posta');

            expect(error.error).toBe('E-posta zaten mevcut');
            expect(error.code).toBe('ALREADY_EXISTS');
        });

        it('should create validationError with details', () => {
            const details = { fields: ['name', 'email'] };
            const error = CommonErrors.validationError('Geçersiz veri', details);

            expect(error.error).toBe('Geçersiz veri');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.details).toEqual(details);
        });

        it('should create invalidInput error with field', () => {
            const error = CommonErrors.invalidInput('telefon');

            expect(error.error).toBe('Geçersiz telefon');
        });

        it('should create invalidInput error without field', () => {
            const error = CommonErrors.invalidInput();

            expect(error.error).toBe('Geçersiz veri');
        });

        it('should create internalError', () => {
            const error = CommonErrors.internalError({ stack: 'error stack' });

            expect(error.error).toBe('Bir hata oluştu');
            expect(error.code).toBe('INTERNAL_ERROR');
        });

        it('should create csrfError', () => {
            const error = CommonErrors.csrfError();

            expect(error.error).toBe('CSRF doğrulaması başarısız');
            expect(error.code).toBe('INVALID_CSRF');
        });

        it('should create rateLimitExceeded error', () => {
            const error = CommonErrors.rateLimitExceeded();

            expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        });

        it('should create workflowError', () => {
            const error = CommonErrors.workflowError('Geçersiz durum geçişi');

            expect(error.error).toBe('Geçersiz durum geçişi');
            expect(error.code).toBe('WORKFLOW_ERROR');
        });
    });

    describe('normalizeError', () => {
        it('should return ApiErrorResponse as-is', () => {
            const apiError = createErrorResponse('Existing error', ErrorCodes.NOT_FOUND);
            const result = normalizeError(apiError);

            expect(result).toBe(apiError);
        });

        it('should normalize Error object', () => {
            const error = new Error('Test error message');
            const result = normalizeError(error);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Test error message');
            expect(result.code).toBe('INTERNAL_ERROR');
        });

        it('should normalize Appwrite error', () => {
            const appwriteError = { message: 'Document not found', code: 404, type: 'document_not_found' };
            const result = normalizeError(appwriteError);

            expect(result.error).toBe('Document not found');
            expect(result.code).toBe('DATABASE_ERROR');
        });

        it('should normalize string error', () => {
            const result = normalizeError('Simple string error');

            expect(result.error).toBe('Simple string error');
            expect(result.code).toBe('INTERNAL_ERROR');
        });

        it('should use fallback message for unknown errors', () => {
            const result = normalizeError(null, 'Fallback message');

            expect(result.error).toBe('Fallback message');
        });

        it('should use default message for unknown errors without fallback', () => {
            const result = normalizeError(undefined);

            expect(result.error).toBe('Beklenmeyen bir hata oluştu');
        });

        it('should handle Appwrite error without message', () => {
            const appwriteError = { code: 404, type: 'document_not_found' };
            const result = normalizeError(appwriteError);

            expect(result.error).toBe('Veritabanı hatası');
            expect(result.code).toBe('DATABASE_ERROR');
        });

        it('should handle object with only type property', () => {
            const error = { type: 'some_error_type' };
            const result = normalizeError(error);

            expect(result.code).toBe('DATABASE_ERROR');
        });

        it('should handle object with only code property', () => {
            const error = { code: 500 };
            const result = normalizeError(error);

            expect(result.code).toBe('DATABASE_ERROR');
        });
    });

    describe('isApiErrorResponse', () => {
        it('should return true for valid error response', () => {
            const error = createErrorResponse('Test error');
            expect(isApiErrorResponse(error)).toBe(true);
        });

        it('should return false for success response', () => {
            const success = createSuccessResponse({ id: '1' });
            expect(isApiErrorResponse(success)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isApiErrorResponse(null)).toBe(false);
        });

        it('should return false for non-object', () => {
            expect(isApiErrorResponse('string')).toBe(false);
        });

        it('should return false for object without success field', () => {
            expect(isApiErrorResponse({ error: 'test' })).toBe(false);
        });
    });

    describe('isApiSuccessResponse', () => {
        it('should return true for valid success response', () => {
            const success = createSuccessResponse({ id: '1' });
            expect(isApiSuccessResponse(success)).toBe(true);
        });

        it('should return false for error response', () => {
            const error = createErrorResponse('Test error');
            expect(isApiSuccessResponse(error)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isApiSuccessResponse(null)).toBe(false);
        });
    });

    describe('getStatusCodeForError', () => {
        it('should return 401 for UNAUTHORIZED', () => {
            expect(getStatusCodeForError(ErrorCodes.UNAUTHORIZED)).toBe(401);
        });

        it('should return 401 for INVALID_TOKEN', () => {
            expect(getStatusCodeForError(ErrorCodes.INVALID_TOKEN)).toBe(401);
        });

        it('should return 401 for SESSION_EXPIRED', () => {
            expect(getStatusCodeForError(ErrorCodes.SESSION_EXPIRED)).toBe(401);
        });

        it('should return 403 for FORBIDDEN', () => {
            expect(getStatusCodeForError(ErrorCodes.FORBIDDEN)).toBe(403);
        });

        it('should return 403 for PERMISSION_DENIED', () => {
            expect(getStatusCodeForError(ErrorCodes.PERMISSION_DENIED)).toBe(403);
        });

        it('should return 403 for INVALID_CSRF', () => {
            expect(getStatusCodeForError(ErrorCodes.INVALID_CSRF)).toBe(403);
        });

        it('should return 404 for NOT_FOUND', () => {
            expect(getStatusCodeForError(ErrorCodes.NOT_FOUND)).toBe(404);
        });

        it('should return 409 for ALREADY_EXISTS', () => {
            expect(getStatusCodeForError(ErrorCodes.ALREADY_EXISTS)).toBe(409);
        });

        it('should return 409 for DUPLICATE_ENTRY', () => {
            expect(getStatusCodeForError(ErrorCodes.DUPLICATE_ENTRY)).toBe(409);
        });

        it('should return 400 for VALIDATION_ERROR', () => {
            expect(getStatusCodeForError(ErrorCodes.VALIDATION_ERROR)).toBe(400);
        });

        it('should return 400 for INVALID_INPUT', () => {
            expect(getStatusCodeForError(ErrorCodes.INVALID_INPUT)).toBe(400);
        });

        it('should return 400 for REQUIRED_FIELD', () => {
            expect(getStatusCodeForError(ErrorCodes.REQUIRED_FIELD)).toBe(400);
        });

        it('should return 429 for RATE_LIMIT_EXCEEDED', () => {
            expect(getStatusCodeForError(ErrorCodes.RATE_LIMIT_EXCEEDED)).toBe(429);
        });

        it('should return 422 for WORKFLOW_ERROR', () => {
            expect(getStatusCodeForError(ErrorCodes.WORKFLOW_ERROR)).toBe(422);
        });

        it('should return 422 for OPERATION_NOT_ALLOWED', () => {
            expect(getStatusCodeForError(ErrorCodes.OPERATION_NOT_ALLOWED)).toBe(422);
        });

        it('should return 500 for INTERNAL_ERROR', () => {
            expect(getStatusCodeForError(ErrorCodes.INTERNAL_ERROR)).toBe(500);
        });

        it('should return 500 for DATABASE_ERROR', () => {
            expect(getStatusCodeForError(ErrorCodes.DATABASE_ERROR)).toBe(500);
        });

        it('should return 500 for undefined code', () => {
            expect(getStatusCodeForError(undefined)).toBe(500);
        });
    });
});
