import { describe, it, expect, vi } from 'vitest';
import {
  successResponse,
  errorResponse,
  handleGetById,
  handleUpdate,
  handleDelete,
  extractParams,
  type ValidationResult,
} from '@/lib/api/route-helpers';

describe('Route Helpers', () => {
  describe('successResponse', () => {
    it('should create a success response with data', async () => {
      const response = successResponse({ id: '123', name: 'Test' });
      expect(response.status).toBe(200);

      // Get the JSON body
      const body = response.json();
      await expect(body).resolves.toMatchObject({
        success: true,
        data: { id: '123', name: 'Test' },
      });
    });

    it('should include optional message', async () => {
      const response = successResponse({ id: '123' }, 'Success message');
      const body = response.json();
      await expect(body).resolves.toMatchObject({
        success: true,
        message: 'Success message',
      });
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', async () => {
      const response = errorResponse('Error occurred', 400);
      expect(response.status).toBe(400);

      const body = response.json();
      await expect(body).resolves.toMatchObject({
        success: false,
        error: 'Error occurred',
      });
    });

    it('should include optional details', async () => {
      const response = errorResponse('Validation error', 400, [
        'Field 1 invalid',
        'Field 2 required',
      ]);
      const body = response.json();
      await expect(body).resolves.toMatchObject({
        success: false,
        error: 'Validation error',
        details: ['Field 1 invalid', 'Field 2 required'],
      });
    });
  });

  describe('handleGetById', () => {
    it('should return error if id is undefined', async () => {
      const mockGetOperation = vi.fn();
      const response = await handleGetById(undefined, mockGetOperation, 'User');

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ID parametresi gerekli');
      expect(mockGetOperation).not.toHaveBeenCalled();
    });

    it('should return success when data is found', async () => {
      const mockGetOperation = vi.fn().mockResolvedValue({
        data: { id: '123', name: 'Test User' },
        error: null,
      });

      const response = await handleGetById('123', mockGetOperation, 'User');

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: '123', name: 'Test User' });
      expect(mockGetOperation).toHaveBeenCalledWith('123');
    });

    it('should return 404 when data is not found', async () => {
      const mockGetOperation = vi.fn().mockResolvedValue({
        data: null,
        error: 'Not found',
      });

      const response = await handleGetById('123', mockGetOperation, 'User');

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('User bulunamadı');
    });

    it('should handle exceptions', async () => {
      const mockGetOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      const response = await handleGetById('123', mockGetOperation, 'User');

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Veri alınamadı');
    });
  });

  describe('handleUpdate', () => {
    const mockValidate = (data: unknown): ValidationResult => {
      const record = data as Record<string, unknown>;
      return {
        isValid: typeof record.name === 'string' && record.name.length > 0,
        errors:
          typeof record.name === 'string' && record.name.length > 0 ? [] : ['Name is required'],
      };
    };

    it('should return error if id is undefined', async () => {
      const mockUpdateOperation = vi.fn();
      const response = await handleUpdate(
        undefined,
        { name: 'Test' },
        mockValidate,
        mockUpdateOperation,
        'User'
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ID parametresi gerekli');
      expect(mockUpdateOperation).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid data', async () => {
      const mockUpdateOperation = vi.fn();
      const response = await handleUpdate(
        '123',
        { name: '' },
        mockValidate,
        mockUpdateOperation,
        'User'
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Doğrulama hatası');
      expect(body.details).toEqual(['Name is required']);
      expect(mockUpdateOperation).not.toHaveBeenCalled();
    });

    it('should return success when update succeeds', async () => {
      const mockUpdateOperation = vi.fn().mockResolvedValue({
        data: { id: '123', name: 'Updated Name' },
        error: null,
      });

      const response = await handleUpdate(
        '123',
        { name: 'Updated Name' },
        mockValidate,
        mockUpdateOperation,
        'User'
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: '123', name: 'Updated Name' });
      expect(body.message).toBe('User güncellendi');
      expect(mockUpdateOperation).toHaveBeenCalledWith('123', { name: 'Updated Name' });
    });
  });

  describe('handleDelete', () => {
    it('should return error if id is undefined', async () => {
      const mockDeleteOperation = vi.fn();
      const response = await handleDelete(undefined, mockDeleteOperation, 'User');

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ID parametresi gerekli');
      expect(mockDeleteOperation).not.toHaveBeenCalled();
    });

    it('should return success when delete succeeds', async () => {
      const mockDeleteOperation = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await handleDelete('123', mockDeleteOperation, 'User');

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('User silindi');
      expect(mockDeleteOperation).toHaveBeenCalledWith('123');
    });

    it('should return error when delete fails', async () => {
      const mockDeleteOperation = vi.fn().mockResolvedValue({
        data: null,
        error: 'Cannot delete',
      });

      const response = await handleDelete('123', mockDeleteOperation, 'User');

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Cannot delete');
    });
  });

  describe('extractParams', () => {
    it('should extract params from promise', async () => {
      const params = Promise.resolve({ id: '123', slug: 'test' });
      const result = await extractParams(params);

      expect(result).toEqual({ id: '123', slug: 'test' });
    });
  });
});
