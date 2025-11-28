import { describe, it, expect } from 'vitest';
import {
  AppError,
  AuthenticationError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  translateError,
  formatErrorMessage,
  createErrorResponse,
} from '@/lib/errors';

describe('Error Handling Library', () => {
  describe('AppError', () => {
    it('should create custom app error', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should default to status 500', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should include details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new AppError('Test error', 'TEST_ERROR', 400, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with defaults', () => {
      const error = new AuthenticationError();
      expect(error.message).toContain('Kimlik doğrulama');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error', () => {
      const error = new UnauthorizedError();
      expect(error.message).toContain('yetkiniz yok');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError();
      expect(error.message).toContain('geçersiz');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default resource', () => {
      const error = new NotFoundError();
      expect(error.message).toContain('bulunamadı');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should accept custom resource name', () => {
      const error = new NotFoundError('Kullanıcı');
      expect(error.message).toBe('Kullanıcı bulunamadı');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError();
      expect(error.message).toContain('Çok fazla istek');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
    });

    it('should include retry after', () => {
      const error = new RateLimitError('Rate limited', 60);
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('translateError', () => {
    it('should translate common HTTP status codes', () => {
      expect(translateError(401)).toContain('Kimlik doğrulama');
      expect(translateError(403)).toContain('yetkiniz yok');
      expect(translateError(404)).toContain('bulunamadı');
      expect(translateError(429)).toContain('Çok fazla');
      expect(translateError(500)).toContain('Sunucu hatası');
    });

    it('should translate custom error codes', () => {
      expect(translateError('user_not_found')).toContain('bulunamadı');
      expect(translateError('user_already_exists')).toContain('zaten kayıtlı');
      expect(translateError('user_invalid_credentials')).toContain('hatalı');
    });

    it('should return default for unknown codes', () => {
      const result = translateError('unknown_error_code');
      expect(result).toContain('Bilinmeyen');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format AppError', () => {
      const error = new ValidationError('Invalid email format');
      const message = formatErrorMessage(error);
      expect(message).toBe('Invalid email format');
    });

    it('should format error with code', () => {
      const error = { code: 'user_not_found' };
      const message = formatErrorMessage(error);
      expect(message).toContain('bulunamadı');
    });

    it('should format error with status', () => {
      const error = { statusCode: 404 };
      const message = formatErrorMessage(error);
      expect(message).toContain('bulunamadı');
    });

    it('should use error message if available', () => {
      const error = { message: 'Custom error message' };
      const message = formatErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should return default for unknown error', () => {
      const message = formatErrorMessage({});
      expect(message).toContain('Bilinmeyen');
    });
  });

  describe('createErrorResponse', () => {
    it('should create response from AppError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const response = createErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid input');
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.details).toEqual({ field: 'email' });
    });

    it('should create response from generic error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle error with code', () => {
      const error = { code: '404', message: 'Not found' };
      const response = createErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.code).toBe('404');
    });
  });
});
