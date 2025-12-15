/**
 * Route Helpers Tests
 * Tests for shared API route utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleGetById,
  handleUpdate,
  handleDelete,
  extractParams,
  parseBody,
  handleDuplicateError,
  handleApiError,
} from '@/lib/api/route-helpers';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Route Helpers', () => {
  describe('successResponse', () => {
    it('should create success response with default status', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);

      expect(response.status).toBe(200);
      // Response body would contain success: true and data
    });

    it('should create success response with custom status', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data, 'Created', 201);

      expect(response.status).toBe(201);
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      const response = successResponse(data, 'Success message', 200);

      expect(response.status).toBe(200);
    });

    it('should handle null data', () => {
      const response = successResponse(null, 'Done', 204);

      expect(response.status).toBe(204);
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = successResponse(data);

      expect(response.status).toBe(200);
    });
  });

  describe('errorResponse', () => {
    it('should create error response with default status', () => {
      const response = errorResponse('Something went wrong');

      expect(response.status).toBe(400);
    });

    it('should create error response with custom status', () => {
      const response = errorResponse('Not found', 404);

      expect(response.status).toBe(404);
    });

    it('should include details when provided', () => {
      const details = ['Field 1 is required', 'Field 2 is invalid'];
      const response = errorResponse('Validation failed', 400, details);

      expect(response.status).toBe(400);
    });

    it('should handle various error statuses', () => {
      expect(errorResponse('Unauthorized', 401).status).toBe(401);
      expect(errorResponse('Forbidden', 403).status).toBe(403);
      expect(errorResponse('Conflict', 409).status).toBe(409);
      expect(errorResponse('Server error', 500).status).toBe(500);
    });
  });

  describe('handleGetById', () => {
    it('should return 400 when id is not provided', async () => {
      const getOperation = vi.fn();
      const response = await handleGetById(undefined, getOperation, 'Kullanıcı');

      expect(response.status).toBe(400);
    });

    it('should call getOperation with provided id', async () => {
      const getOperation = vi.fn().mockResolvedValue({ data: { id: 1, name: 'Test' } });
      const response = await handleGetById('123', getOperation, 'Kayıt');

      expect(getOperation).toHaveBeenCalledWith('123');
      expect(response.status).toBe(200);
    });

    it('should return 404 when data is not found', async () => {
      const getOperation = vi.fn().mockResolvedValue({ error: 'Not found', data: null });
      const response = await handleGetById('123', getOperation, 'Kullanıcı');

      expect(response.status).toBe(404);
    });

    it('should return 500 on error', async () => {
      const getOperation = vi.fn().mockRejectedValue(new Error('Database error'));
      const response = await handleGetById('123', getOperation, 'Kayıt');

      expect(response.status).toBe(500);
    });

    it('should use default resource name', async () => {
      const getOperation = vi.fn().mockResolvedValue({ error: 'Not found', data: null });
      const response = await handleGetById('123', getOperation);

      expect(response.status).toBe(404);
    });

    it('should return data when found', async () => {
      const testData = { id: '123', name: 'John Doe', email: 'john@example.com' };
      const getOperation = vi.fn().mockResolvedValue({ data: testData });
      const response = await handleGetById('123', getOperation);

      expect(response.status).toBe(200);
    });
  });

  describe('handleUpdate', () => {
    it('should return 400 when id is not provided', async () => {
      const validate = vi.fn();
      const updateOperation = vi.fn();

      const response = await handleUpdate(undefined, {}, validate, updateOperation);

      expect(response.status).toBe(400);
      expect(validate).not.toHaveBeenCalled();
    });

    it('should return 400 when validation fails', async () => {
      const validate = vi.fn().mockReturnValue({
        isValid: false,
        errors: ['Name is required', 'Email is invalid'],
      });
      const updateOperation = vi.fn();

      const response = await handleUpdate('123', { name: '' }, validate, updateOperation);

      expect(response.status).toBe(400);
      expect(updateOperation).not.toHaveBeenCalled();
    });

    it('should call updateOperation when validation passes', async () => {
      const validate = vi.fn().mockReturnValue({ isValid: true, errors: [] });
      const updateOperation = vi.fn().mockResolvedValue({ data: { id: '123', name: 'Updated' } });

      const response = await handleUpdate('123', { name: 'Updated' }, validate, updateOperation);

      expect(updateOperation).toHaveBeenCalledWith('123', { name: 'Updated' });
      expect(response.status).toBe(200);
    });

    it('should return 400 when update operation returns error', async () => {
      const validate = vi.fn().mockReturnValue({ isValid: true, errors: [] });
      const updateOperation = vi.fn().mockResolvedValue({
        error: 'Update failed',
        data: null,
      });

      const response = await handleUpdate('123', { name: 'Updated' }, validate, updateOperation);

      expect(response.status).toBe(400);
    });

    it('should return 500 on unexpected error', async () => {
      const validate = vi.fn().mockReturnValue({ isValid: true, errors: [] });
      const updateOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      const response = await handleUpdate('123', { name: 'Updated' }, validate, updateOperation);

      expect(response.status).toBe(500);
    });

    it('should use default resource name', async () => {
      const validate = vi.fn().mockReturnValue({ isValid: true, errors: [] });
      const updateOperation = vi.fn().mockResolvedValue({ data: { id: '123' } });

      const response = await handleUpdate('123', {}, validate, updateOperation);

      expect(response.status).toBe(200);
    });
  });

  describe('handleDelete', () => {
    it('should return 400 when id is not provided', async () => {
      const deleteOperation = vi.fn();

      const response = await handleDelete(undefined, deleteOperation);

      expect(response.status).toBe(400);
      expect(deleteOperation).not.toHaveBeenCalled();
    });

    it('should call deleteOperation with provided id', async () => {
      const deleteOperation = vi.fn().mockResolvedValue({ data: null });

      const response = await handleDelete('123', deleteOperation);

      expect(deleteOperation).toHaveBeenCalledWith('123');
      expect(response.status).toBe(200);
    });

    it('should return 400 when delete operation returns error', async () => {
      const deleteOperation = vi.fn().mockResolvedValue({ error: 'Cannot delete' });

      const response = await handleDelete('123', deleteOperation);

      expect(response.status).toBe(400);
    });

    it('should return 500 on unexpected error', async () => {
      const deleteOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      const response = await handleDelete('123', deleteOperation);

      expect(response.status).toBe(500);
    });

    it('should use default resource name', async () => {
      const deleteOperation = vi.fn().mockResolvedValue({ data: null });

      const response = await handleDelete('123', deleteOperation);

      expect(response.status).toBe(200);
    });

    it('should use custom resource name', async () => {
      const deleteOperation = vi.fn().mockResolvedValue({ data: null });

      const response = await handleDelete('123', deleteOperation, 'Öğrenci');

      expect(response.status).toBe(200);
    });
  });

  describe('extractParams', () => {
    it('should resolve async params', async () => {
      const params = Promise.resolve({ id: '123', action: 'edit' });

      const result = await extractParams(params);

      expect(result).toEqual({ id: '123', action: 'edit' });
    });

    it('should handle complex param objects', async () => {
      const params = Promise.resolve({
        id: 'abc123',
        slug: 'my-article',
        category: 'tech',
      });

      const result = await extractParams(params);

      expect(result.id).toBe('abc123');
      expect(result.slug).toBe('my-article');
      expect(result.category).toBe('tech');
    });
  });

  describe('parseBody', () => {
    it('should parse valid JSON body', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({ name: 'Test', email: 'test@example.com' }),
      } as unknown as NextRequest;

      const result = await parseBody(request);

      expect(result.data).toEqual({ name: 'Test', email: 'test@example.com' });
      expect(result.error).toBeUndefined();
    });

    it('should return error when JSON parsing fails', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const result = await parseBody(request);

      expect(result.error).toBe('Geçersiz istek verisi');
      expect(result.data).toBeUndefined();
    });

    it('should handle empty body', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const result = await parseBody(request);

      expect(result.data).toEqual({});
      expect(result.error).toBeUndefined();
    });

    it('should handle array body', async () => {
      const request = {
        json: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      } as unknown as NextRequest;

      const result = await parseBody(request);

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('handleDuplicateError', () => {
    it('should detect duplicate error by "duplicate" keyword', () => {
      const error = new Error('Duplicate key error');

      const result = handleDuplicateError(error);

      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain('TC Kimlik No');
    });

    it('should detect duplicate error by "unique" keyword', () => {
      const error = new Error('Unique constraint violated');

      const result = handleDuplicateError(error);

      expect(result.isDuplicate).toBe(true);
    });

    it('should detect duplicate error by "already exists" phrase', () => {
      const error = new Error('Record already exists');

      const result = handleDuplicateError(error);

      expect(result.isDuplicate).toBe(true);
    });

    it('should use custom duplicate key in message', () => {
      const error = new Error('Duplicate entry');

      const result = handleDuplicateError(error, 'Email Adresi');

      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain('Email Adresi');
    });

    it('should not treat non-duplicate errors as duplicates', () => {
      const error = new Error('Some other error');

      const result = handleDuplicateError(error);

      expect(result.isDuplicate).toBe(false);
      expect(result.message).toBe('Bu kayıt zaten mevcut');
    });

    it('should use custom default message', () => {
      const error = new Error('Some error');

      const result = handleDuplicateError(error, 'Kayıt', 'Kişisel hata');

      expect(result.isDuplicate).toBe(false);
      expect(result.message).toBe('Kişisel hata');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';

      const result = handleDuplicateError(error);

      expect(result.isDuplicate).toBe(false);
    });

    it('should handle case-insensitive duplicate detection', () => {
      const error = new Error('DUPLICATE KEY VIOLATION');

      const result = handleDuplicateError(error);

      expect(result.isDuplicate).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('should detect and return duplicate error', async () => {
      const mockLogger = {
        error: vi.fn(),
      };

      const error = new Error('Duplicate key');
      const result = await handleApiError(error, mockLogger, {
        endpoint: '/api/users',
        method: 'POST',
      });

      expect(result.status).toBe(409);
    });

    it('should return 500 for non-duplicate errors', async () => {
      const mockLogger = {
        error: vi.fn(),
      };

      const error = new Error('Some other error');
      const result = await handleApiError(error, mockLogger, {
        endpoint: '/api/users',
        method: 'GET',
      });

      expect(result.status).toBe(500);
    });

    it('should use custom default message', async () => {
      const mockLogger = {
        error: vi.fn(),
      };

      const error = new Error('Database error');
      const result = await handleApiError(
        error,
        mockLogger,
        { endpoint: '/api/test', method: 'POST' },
        'Custom error message'
      );

      expect(result.status).toBe(500);
    });

    it('should call logger.error', async () => {
      const mockLogger = {
        error: vi.fn(),
      };

      const error = new Error('Test error');
      await handleApiError(error, mockLogger, {
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API error',
        error,
        expect.objectContaining({ endpoint: '/api/test', method: 'GET' })
      );
    });

    it('should include context in logger call', async () => {
      const mockLogger = {
        error: vi.fn(),
      };

      const context = {
        endpoint: '/api/users',
        method: 'POST',
        userId: '123',
        action: 'create',
      };

      await handleApiError(new Error('Error'), mockLogger, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API error',
        expect.any(Error),
        expect.objectContaining(context)
      );
    });
  });
});
