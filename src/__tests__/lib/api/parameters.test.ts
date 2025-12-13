import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parametersApi } from '@/lib/api/parameters';
import * as appwriteModule from '@/lib/appwrite/api';

// Mock Appwrite parameters API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteParameters: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('parametersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllParameters', () => {
    it('returns all parameters successfully', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', value: 3000 },
        { category: 'config', key: 'retry', value: 3 },
        { category: 'ui', key: 'theme', value: 'dark' },
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 3,
      } as any);

      const result = await parametersApi.getAllParameters();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.error).toBeNull();
    });

    it('handles empty parameter list', async () => {
      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: [],
        total: 0,
      } as any);

      const result = await parametersApi.getAllParameters();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(appwriteModule.appwriteParameters.list).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await parametersApi.getAllParameters();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Database connection failed');
    });

    it('handles missing document properties', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', value: 3000 },
        { key: 'empty', value: 100 }, // Missing category
        { category: 'ui', value: 'theme' }, // Missing key
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 3,
      } as any);

      const result = await parametersApi.getAllParameters();

      expect(result.success).toBe(true);
      expect(result.data[1].category).toBe('');
      expect(result.data[2].key).toBe('');
    });
  });

  describe('getParametersByCategory', () => {
    it('returns parameters for specific category', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', value: 3000 },
        { category: 'config', key: 'retry', value: 3 },
        { category: 'ui', key: 'theme', value: 'dark' },
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 3,
      } as any);

      const result = await parametersApi.getParametersByCategory('config');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((p: any) => p.category === 'config')).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns empty list for non-existent category', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', value: 3000 },
        { category: 'ui', key: 'theme', value: 'dark' },
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 2,
      } as any);

      const result = await parametersApi.getParametersByCategory('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('returns error when category is not provided', async () => {
      const result = await parametersApi.getParametersByCategory();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Kategori gereklidir');
      expect(vi.mocked(appwriteModule.appwriteParameters.list)).not.toHaveBeenCalled();
    });

    it('returns error when category is empty string', async () => {
      const result = await parametersApi.getParametersByCategory('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori gereklidir');
    });

    it('handles errors during category fetch', async () => {
      vi.mocked(appwriteModule.appwriteParameters.list).mockRejectedValue(
        new Error('Failed to fetch parameters')
      );

      const result = await parametersApi.getParametersByCategory('config');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch parameters');
    });
  });

  describe('createParameter', () => {
    it('creates parameter successfully', async () => {
      vi.mocked(appwriteModule.appwriteParameters.create).mockResolvedValue({} as any);

      const result = await parametersApi.createParameter({
        category: 'config',
        key: 'timeout',
        value: 3000,
        updatedBy: 'admin',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(vi.mocked(appwriteModule.appwriteParameters.create)).toHaveBeenCalledWith({
        category: 'config',
        key: 'timeout',
        value: 3000,
        updated_by: 'admin',
      });
    });

    it('handles creation without updatedBy', async () => {
      vi.mocked(appwriteModule.appwriteParameters.create).mockResolvedValue({} as any);

      const result = await parametersApi.createParameter({
        category: 'config',
        key: 'timeout',
        value: 3000,
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(appwriteModule.appwriteParameters.create)).toHaveBeenCalledWith({
        category: 'config',
        key: 'timeout',
        value: 3000,
        updated_by: undefined,
      });
    });

    it('returns error when category is missing', async () => {
      const result = await parametersApi.createParameter({
        key: 'timeout',
        value: 3000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
      expect(vi.mocked(appwriteModule.appwriteParameters.create)).not.toHaveBeenCalled();
    });

    it('returns error when key is missing', async () => {
      const result = await parametersApi.createParameter({
        category: 'config',
        value: 3000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
      expect(vi.mocked(appwriteModule.appwriteParameters.create)).not.toHaveBeenCalled();
    });

    it('returns error when data is undefined', async () => {
      const result = await parametersApi.createParameter(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
    });

    it('returns error when data is null', async () => {
      const result = await parametersApi.createParameter(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
    });

    it('handles creation errors', async () => {
      vi.mocked(appwriteModule.appwriteParameters.create).mockRejectedValue(
        new Error('Create failed')
      );

      const result = await parametersApi.createParameter({
        category: 'config',
        key: 'timeout',
        value: 3000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Create failed');
    });
  });

  describe('updateParameter', () => {
    it('updates parameter successfully', async () => {
      vi.mocked(appwriteModule.appwriteParameters.update).mockResolvedValue({} as any);

      const result = await parametersApi.updateParameter('param-123', {
        category: 'config',
        key: 'timeout',
        value: 5000,
        updatedBy: 'admin',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(vi.mocked(appwriteModule.appwriteParameters.update)).toHaveBeenCalledWith(
        'param-123',
        {
          category: 'config',
          key: 'timeout',
          value: 5000,
          updated_by: 'admin',
        }
      );
    });

    it('returns error when id is missing', async () => {
      const result = await parametersApi.updateParameter(undefined, {
        category: 'config',
        key: 'timeout',
        value: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID, kategori ve anahtar gereklidir');
      expect(vi.mocked(appwriteModule.appwriteParameters.update)).not.toHaveBeenCalled();
    });

    it('returns error when category is missing', async () => {
      const result = await parametersApi.updateParameter('param-123', {
        key: 'timeout',
        value: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID, kategori ve anahtar gereklidir');
    });

    it('returns error when key is missing', async () => {
      const result = await parametersApi.updateParameter('param-123', {
        category: 'config',
        value: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID, kategori ve anahtar gereklidir');
    });

    it('returns error when data is undefined', async () => {
      const result = await parametersApi.updateParameter('param-123', undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID, kategori ve anahtar gereklidir');
    });

    it('handles update errors', async () => {
      vi.mocked(appwriteModule.appwriteParameters.update).mockRejectedValue(
        new Error('Update failed')
      );

      const result = await parametersApi.updateParameter('param-123', {
        category: 'config',
        key: 'timeout',
        value: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('handles non-error exceptions', async () => {
      vi.mocked(appwriteModule.appwriteParameters.update).mockRejectedValue('String error');

      const result = await parametersApi.updateParameter('param-123', {
        category: 'config',
        key: 'timeout',
        value: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('deleteParameter', () => {
    it('deletes parameter successfully by category and key', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', $id: 'param-123' },
        { category: 'config', key: 'retry', $id: 'param-124' },
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 2,
      } as any);
      vi.mocked(appwriteModule.appwriteParameters.remove).mockResolvedValue({} as any);

      const result = await parametersApi.deleteParameter({
        category: 'config',
        key: 'timeout',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(vi.mocked(appwriteModule.appwriteParameters.remove)).toHaveBeenCalledWith(
        'param-123'
      );
    });

    it('deletes parameter using _id if available', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', _id: 'param-old-123' },
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 1,
      } as any);
      vi.mocked(appwriteModule.appwriteParameters.remove).mockResolvedValue({} as any);

      const result = await parametersApi.deleteParameter({
        category: 'config',
        key: 'timeout',
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(appwriteModule.appwriteParameters.remove)).toHaveBeenCalledWith(
        'param-old-123'
      );
    });

    it('succeeds even if parameter not found', async () => {
      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: [],
        total: 0,
      } as any);

      const result = await parametersApi.deleteParameter({
        category: 'config',
        key: 'nonexistent',
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(appwriteModule.appwriteParameters.remove)).not.toHaveBeenCalled();
    });

    it('returns error when category is missing', async () => {
      const result = await parametersApi.deleteParameter({
        key: 'timeout',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
      expect(vi.mocked(appwriteModule.appwriteParameters.list)).not.toHaveBeenCalled();
    });

    it('returns error when key is missing', async () => {
      const result = await parametersApi.deleteParameter({
        category: 'config',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
    });

    it('returns error when data is undefined', async () => {
      const result = await parametersApi.deleteParameter(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategori ve anahtar gereklidir');
    });

    it('handles deletion errors', async () => {
      const mockParameters = [
        { category: 'config', key: 'timeout', $id: 'param-123' },
      ];

      vi.mocked(appwriteModule.appwriteParameters.list).mockResolvedValue({
        documents: mockParameters,
        total: 1,
      } as any);
      vi.mocked(appwriteModule.appwriteParameters.remove).mockRejectedValue(
        new Error('Delete failed')
      );

      const result = await parametersApi.deleteParameter({
        category: 'config',
        key: 'timeout',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });

    it('handles fetch errors during deletion', async () => {
      vi.mocked(appwriteModule.appwriteParameters.list).mockRejectedValue(
        new Error('Fetch failed')
      );

      const result = await parametersApi.deleteParameter({
        category: 'config',
        key: 'timeout',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fetch failed');
    });
  });
});
