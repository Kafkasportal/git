/**
 * CRUD Factory Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock api-cache
vi.mock('@/lib/api-cache', () => ({
    getCache: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
    })),
}));

// Mock csrf-client
vi.mock('@/lib/csrf-client', () => ({
    fetchWithCsrf: vi.fn(),
}));

import { createCrudOperations, beneficiaries, donations, tasks } from '@/lib/api/crud-factory';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { getCache } from '@/lib/api-cache';

describe('CRUD Factory', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;
    let mockCache: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        vi.clearAllMocks();
        fetchSpy = vi.spyOn(global, 'fetch');
        mockCache = {
            get: vi.fn(),
            set: vi.fn(),
        };
        vi.mocked(getCache).mockReturnValue(mockCache as any);
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe('createCrudOperations', () => {
        it('should create CRUD operations for an entity', () => {
            const crud = createCrudOperations('test-entity');

            expect(crud.getAll).toBeDefined();
            expect(crud.getById).toBeDefined();
            expect(crud.create).toBeDefined();
            expect(crud.update).toBeDefined();
            expect(crud.delete).toBeDefined();
        });
    });

    describe('getAll', () => {
        it('should fetch all items', async () => {
            const mockData = { success: true, data: [{ id: '1' }] };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            const result = await crud.getAll();

            expect(fetchSpy).toHaveBeenCalledWith('/api/test', expect.any(Object));
            expect(result).toEqual(mockData);
        });

        it('should include query params', async () => {
            const mockData = { success: true, data: [] };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            await crud.getAll({ page: 2, limit: 10, search: 'query' });

            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.any(Object)
            );
        });

        it('should include filters in query params', async () => {
            const mockData = { success: true, data: [] };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            await crud.getAll({ filters: { status: 'active', type: 'donation' } });

            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('status=active'),
                expect.any(Object)
            );
        });

        it('should skip null/undefined filter values', async () => {
            const mockData = { success: true, data: [] };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            await crud.getAll({ filters: { status: 'active', type: undefined, category: null } });

            const callUrl = fetchSpy.mock.calls[0][0] as string;
            expect(callUrl).toContain('status=active');
            expect(callUrl).not.toContain('type=');
            expect(callUrl).not.toContain('category=');
        });

        it('should return cached data if available', async () => {
            const cachedData = { success: true, data: [{ id: 'cached' }] };
            mockCache.get.mockReturnValue(cachedData);

            const crud = createCrudOperations('test', 'beneficiaries');
            const result = await crud.getAll();

            expect(result).toEqual(cachedData);
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        it('should cache successful responses', async () => {
            const mockData = { success: true, data: [{ id: '1' }] };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));
            mockCache.get.mockReturnValue(null);

            const crud = createCrudOperations('test', 'beneficiaries');
            await crud.getAll();

            expect(mockCache.set).toHaveBeenCalled();
        });
    });

    describe('getById', () => {
        it('should fetch item by id', async () => {
            const mockData = { success: true, data: { id: '123' } };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            const result = await crud.getById('123');

            expect(fetchSpy).toHaveBeenCalledWith('/api/test/123', expect.any(Object));
            expect(result).toEqual(mockData);
        });
    });

    describe('create', () => {
        it('should create item using fetchWithCsrf', async () => {
            const mockData = { success: true, data: { id: 'new-1' } };
            vi.mocked(fetchWithCsrf).mockResolvedValue(new Response(JSON.stringify(mockData), { status: 201 }));

            const crud = createCrudOperations('test');
            const result = await crud.create({ name: 'New Item' } as any);

            expect(fetchWithCsrf).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'New Item' }),
            }));
            expect(result).toEqual(mockData);
        });
    });

    describe('update', () => {
        it('should update item using fetchWithCsrf', async () => {
            const mockData = { success: true, data: { id: '123', name: 'Updated' } };
            vi.mocked(fetchWithCsrf).mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            const result = await crud.update('123', { name: 'Updated' } as any);

            expect(fetchWithCsrf).toHaveBeenCalledWith('/api/test/123', expect.objectContaining({
                method: 'PUT',
            }));
            expect(result).toEqual(mockData);
        });
    });

    describe('delete', () => {
        it('should delete item using fetchWithCsrf', async () => {
            const mockData = { success: true, data: null };
            vi.mocked(fetchWithCsrf).mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

            const crud = createCrudOperations('test');
            const result = await crud.delete('123');

            expect(fetchWithCsrf).toHaveBeenCalledWith('/api/test/123', expect.objectContaining({
                method: 'DELETE',
            }));
            expect(result).toEqual(mockData);
        });
    });

    describe('error handling', () => {
        it('should throw error for non-ok response', async () => {
            const mockError = { success: false, error: 'Not found' };
            fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockError), { status: 404 }));

            const crud = createCrudOperations('test');

            await expect(crud.getById('nonexistent')).rejects.toThrow('Not found');
        });

        it('should throw generic error for non-ok response without error message', async () => {
            fetchSpy.mockResolvedValue(new Response(JSON.stringify({}), { status: 500, statusText: 'Internal Server Error' }));

            const crud = createCrudOperations('test');

            await expect(crud.getById('123')).rejects.toThrow('API Error: 500 Internal Server Error');
        });

        it('should throw error for invalid JSON response', async () => {
            fetchSpy.mockResolvedValue(new Response('not json', { status: 200 }));

            const crud = createCrudOperations('test');

            await expect(crud.getById('123')).rejects.toThrow('Invalid JSON response from API');
        });

        it('should throw error for invalid JSON on error response', async () => {
            fetchSpy.mockResolvedValue(new Response('not json', { status: 500, statusText: 'Server Error' }));

            const crud = createCrudOperations('test');

            await expect(crud.getById('123')).rejects.toThrow('API Error: 500 Server Error');
        });
    });

    describe('pre-configured exports', () => {
        it('should export beneficiaries CRUD', () => {
            expect(beneficiaries).toBeDefined();
            expect(beneficiaries.getAll).toBeDefined();
        });

        it('should export donations CRUD', () => {
            expect(donations).toBeDefined();
            expect(donations.getAll).toBeDefined();
        });

        it('should export tasks CRUD', () => {
            expect(tasks).toBeDefined();
            expect(tasks.getAll).toBeDefined();
        });
    });
});
