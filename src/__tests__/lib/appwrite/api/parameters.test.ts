/**
 * Appwrite Parameters API Direct Tests
 * Tests for lib/appwrite/api/parameters.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to declare mock functions before vi.mock hoisting
const {
    mockListDocuments,
    mockGetDocument,
    mockCreateDocument,
    mockUpdateDocument,
    mockDeleteDocument,
} = vi.hoisted(() => ({
    mockListDocuments: vi.fn(),
    mockGetDocument: vi.fn(),
    mockCreateDocument: vi.fn(),
    mockUpdateDocument: vi.fn(),
    mockDeleteDocument: vi.fn(),
}));

// Mock base module
vi.mock('@/lib/appwrite/api/base', () => ({
    listDocuments: mockListDocuments,
    getDocument: mockGetDocument,
    createDocument: mockCreateDocument,
    updateDocument: mockUpdateDocument,
    deleteDocument: mockDeleteDocument,
}));

// Import after mocks
import { appwriteParameters } from '@/lib/appwrite/api/parameters';

describe('appwriteParameters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list all parameters without params', async () => {
            const mockParams = [
                { $id: '1', category: 'config', key: 'timeout', value: 3000 },
                { $id: '2', category: 'config', key: 'retry', value: 3 },
            ];
            mockListDocuments.mockResolvedValue({
                documents: mockParams,
                total: 2,
            });

            const result = await appwriteParameters.list();

            expect(result).toEqual({ documents: mockParams, total: 2 });
            expect(mockListDocuments).toHaveBeenCalledWith('parameters', undefined);
        });

        it('should list parameters with query params', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const params = { limit: 10, skip: 5 };
            await appwriteParameters.list(params);

            expect(mockListDocuments).toHaveBeenCalledWith('parameters', params);
        });

        it('should return empty list when no parameters exist', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteParameters.list();

            expect(result.documents).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('should propagate errors from base module', async () => {
            mockListDocuments.mockRejectedValue(new Error('List failed'));

            await expect(appwriteParameters.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get parameter by id', async () => {
            const mockParam = { $id: 'param-123', category: 'config', key: 'timeout', value: 3000 };
            mockGetDocument.mockResolvedValue(mockParam);

            const result = await appwriteParameters.get('param-123');

            expect(result).toEqual(mockParam);
            expect(mockGetDocument).toHaveBeenCalledWith('parameters', 'param-123');
        });

        it('should return null when parameter not found', async () => {
            mockGetDocument.mockResolvedValue(null);

            const result = await appwriteParameters.get('nonexistent');

            expect(result).toBeNull();
        });

        it('should propagate errors from base module', async () => {
            mockGetDocument.mockRejectedValue(new Error('Not found'));

            await expect(appwriteParameters.get('invalid')).rejects.toThrow('Not found');
        });
    });

    describe('create', () => {
        it('should create new parameter', async () => {
            const newParam = { category: 'config', key: 'newKey', value: 'newValue' };
            const createdParam = { $id: 'new-id', ...newParam };
            mockCreateDocument.mockResolvedValue(createdParam);

            const result = await appwriteParameters.create(newParam);

            expect(result).toEqual(createdParam);
            expect(mockCreateDocument).toHaveBeenCalledWith('parameters', newParam);
        });

        it('should create parameter with complex value', async () => {
            const newParam = { category: 'config', key: 'complex', value: { nested: true, arr: [1, 2, 3] } };
            mockCreateDocument.mockResolvedValue({ $id: 'new-id', ...newParam });

            const result = await appwriteParameters.create(newParam);

            expect(result.value).toEqual({ nested: true, arr: [1, 2, 3] });
        });

        it('should propagate errors from base module', async () => {
            mockCreateDocument.mockRejectedValue(new Error('Create failed'));

            await expect(appwriteParameters.create({ category: 'test', key: 'test' })).rejects.toThrow('Create failed');
        });
    });

    describe('update', () => {
        it('should update existing parameter', async () => {
            const updateData = { value: 5000 };
            const updatedParam = { $id: 'param-123', category: 'config', key: 'timeout', value: 5000 };
            mockUpdateDocument.mockResolvedValue(updatedParam);

            const result = await appwriteParameters.update('param-123', updateData);

            expect(result).toEqual(updatedParam);
            expect(mockUpdateDocument).toHaveBeenCalledWith('parameters', 'param-123', updateData);
        });

        it('should update multiple fields', async () => {
            const updateData = { category: 'newCategory', key: 'newKey', value: 'newValue' };
            mockUpdateDocument.mockResolvedValue({ $id: 'param-123', ...updateData });

            const result = await appwriteParameters.update('param-123', updateData);

            expect(result.category).toBe('newCategory');
            expect(result.key).toBe('newKey');
        });

        it('should propagate errors from base module', async () => {
            mockUpdateDocument.mockRejectedValue(new Error('Update failed'));

            await expect(appwriteParameters.update('param-123', { value: 0 })).rejects.toThrow('Update failed');
        });
    });

    describe('remove', () => {
        it('should remove parameter by id', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteParameters.remove('param-123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('parameters', 'param-123');
        });

        it('should propagate errors from base module', async () => {
            mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));

            await expect(appwriteParameters.remove('param-123')).rejects.toThrow('Delete failed');
        });
    });
});
