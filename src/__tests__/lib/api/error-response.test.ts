import { describe, it, expect } from 'vitest';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  CommonErrors,
  normalizeError,
  isApiErrorResponse,
  isApiSuccessResponse,
  getStatusCodeForError,
} from '@/lib/api/error-response';

describe('Error Response Utilities', () => {
  describe('createErrorResponse', () => {
    it('should create a basic error response', () => {
      const error = createErrorResponse('Test error');

      expect(error.success).toBe(false);
      expect(error.error).toBe('Test error');
      expect(error.timestamp).toBeDefined();
    });

    it('should include error code when provided', () => {
      const error = createErrorResponse('Not found', ErrorCodes.NOT_FOUND);

      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should include details when provided', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = createErrorResponse('Validation error', ErrorCodes.VALIDATION_ERROR, details);

      expect(error.details).toEqual(details);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });

    it('should include message when provided', () => {
      const response = createSuccessResponse({ id: '123' }, 'Created successfully');

      expect(response.message).toBe('Created successfully');
    });
  });

  describe('CommonErrors', () => {
    it('should create unauthorized error', () => {
      const error = CommonErrors.unauthorized();

      expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(error.error).toBeDefined();
    });

    it('should create forbidden error with custom reason', () => {
      const error = CommonErrors.forbidden('Custom reason');

      expect(error.code).toBe(ErrorCodes.FORBIDDEN);
      expect(error.error).toBe('Custom reason');
    });

    it('should create not found error with custom resource', () => {
      const error = CommonErrors.notFound('User');

      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.error).toContain('User');
    });

    it('should create validation error with details', () => {
      const details = { field: 'email' };
      const error = CommonErrors.validationError('Invalid email', details);

      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.details).toEqual(details);
    });

    it('should create workflow error', () => {
      const error = CommonErrors.workflowError('Transition not allowed');

      expect(error.code).toBe(ErrorCodes.WORKFLOW_ERROR);
      expect(error.error).toBe('Transition not allowed');
    });
  });

  describe('normalizeError', () => {
    it('should pass through ApiErrorResponse', () => {
      const original = createErrorResponse('Test', ErrorCodes.NOT_FOUND);
      const normalized = normalizeError(original);

      expect(normalized).toEqual(original);
    });

    it('should convert Error object', () => {
      const error = new Error('Test error');
      const normalized = normalizeError(error);

      expect(normalized.success).toBe(false);
      expect(normalized.error).toBe('Test error');
      expect(normalized.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should convert string error', () => {
      const normalized = normalizeError('String error');

      expect(normalized.success).toBe(false);
      expect(normalized.error).toBe('String error');
      expect(normalized.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should handle unknown error with fallback message', () => {
      const normalized = normalizeError({}, 'Custom fallback');

      expect(normalized.error).toBe('Custom fallback');
    });

    it('should convert Appwrite-like error', () => {
      const appwriteError = {
        message: 'Document not found',
        code: 404,
        type: 'document_not_found',
      };

      const normalized = normalizeError(appwriteError);

      expect(normalized.error).toBe('Document not found');
      expect(normalized.code).toBe(ErrorCodes.DATABASE_ERROR);
    });
  });

  describe('Type Guards', () => {
    it('isApiErrorResponse should identify error responses', () => {
      const error = createErrorResponse('Test');

      expect(isApiErrorResponse(error)).toBe(true);
      expect(isApiErrorResponse({ success: true, data: {} })).toBe(false);
      expect(isApiErrorResponse('string')).toBe(false);
      expect(isApiErrorResponse(null)).toBe(false);
    });

    it('isApiSuccessResponse should identify success responses', () => {
      const success = createSuccessResponse({ id: '123' });

      expect(isApiSuccessResponse(success)).toBe(true);
      expect(isApiSuccessResponse({ success: false, error: 'Test' })).toBe(false);
      expect(isApiSuccessResponse('string')).toBe(false);
    });
  });

  describe('getStatusCodeForError', () => {
    it('should return 401 for unauthorized errors', () => {
      expect(getStatusCodeForError(ErrorCodes.UNAUTHORIZED)).toBe(401);
      expect(getStatusCodeForError(ErrorCodes.INVALID_TOKEN)).toBe(401);
      expect(getStatusCodeForError(ErrorCodes.SESSION_EXPIRED)).toBe(401);
    });

    it('should return 403 for forbidden errors', () => {
      expect(getStatusCodeForError(ErrorCodes.FORBIDDEN)).toBe(403);
      expect(getStatusCodeForError(ErrorCodes.PERMISSION_DENIED)).toBe(403);
      expect(getStatusCodeForError(ErrorCodes.INVALID_CSRF)).toBe(403);
    });

    it('should return 404 for not found errors', () => {
      expect(getStatusCodeForError(ErrorCodes.NOT_FOUND)).toBe(404);
    });

    it('should return 409 for conflict errors', () => {
      expect(getStatusCodeForError(ErrorCodes.ALREADY_EXISTS)).toBe(409);
      expect(getStatusCodeForError(ErrorCodes.DUPLICATE_ENTRY)).toBe(409);
    });

    it('should return 400 for validation errors', () => {
      expect(getStatusCodeForError(ErrorCodes.VALIDATION_ERROR)).toBe(400);
      expect(getStatusCodeForError(ErrorCodes.INVALID_INPUT)).toBe(400);
    });

    it('should return 429 for rate limit errors', () => {
      expect(getStatusCodeForError(ErrorCodes.RATE_LIMIT_EXCEEDED)).toBe(429);
    });

    it('should return 422 for workflow errors', () => {
      expect(getStatusCodeForError(ErrorCodes.WORKFLOW_ERROR)).toBe(422);
    });

    it('should return 500 for server errors and undefined', () => {
      expect(getStatusCodeForError(ErrorCodes.INTERNAL_ERROR)).toBe(500);
      expect(getStatusCodeForError(ErrorCodes.DATABASE_ERROR)).toBe(500);
      expect(getStatusCodeForError(undefined)).toBe(500);
    });
  });
});
