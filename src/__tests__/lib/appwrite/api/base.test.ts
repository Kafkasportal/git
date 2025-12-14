/**
 * Appwrite API Base Module Tests
 * Tests for generic CRUD operations and query utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node-appwrite Databases with a factory function
const mockListDocuments = vi.fn();
const mockGetDocument = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();

vi.mock('node-appwrite', () => {
    return {
        Databases: class {
            listDocuments = mockListDocuments;
            getDocument = mockGetDocument;
            createDocument = mockCreateDocument;
            updateDocument = mockUpdateDocument;
            deleteDocument = mockDeleteDocument;
        },
    };
});

// Mock the server client before importing the module
vi.mock('@/lib/appwrite/server', () => ({
    serverClient: {
        config: {
            endpoint: 'https://test.appwrite.io/v1',
            project: 'test-project',
        },
    },
}));

// Mock the config
vi.mock('@/lib/appwrite/config', () => ({
    appwriteConfig: {
        databaseId: 'test-database',
        collections: {
            beneficiaries: 'beneficiaries-collection',
            donations: 'donations-collection',
            tasks: 'tasks-collection',
            users: 'users-collection',
            meetings: 'meetings-collection',
        },
    },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock appwrite Query
vi.mock('appwrite', () => ({
    ID: {
        unique: vi.fn(() => 'unique-id-123'),
    },
    Query: {
        limit: vi.fn((n: number) => `limit(${n})`),
        offset: vi.fn((n: number) => `offset(${n})`),
        equal: vi.fn((field: string, value: string) => `equal(${field},${value})`),
        contains: vi.fn((field: string, value: string) => `contains(${field},${value})`),
        or: vi.fn((queries: string[]) => `or(${queries.join(',')})`),
    },
}));

// Import after mocks
import {
    normalizeQueryParams,
    buildQueries,
    getDatabases,
    listDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
} from '@/lib/appwrite/api/base';

describe('Appwrite API Base Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('normalizeQueryParams', () => {
        it('should return empty object for empty params', () => {
            const params = new URLSearchParams();
            const result = normalizeQueryParams(params);
            expect(result).toEqual({});
        });

        it('should parse limit parameter', () => {
            const params = new URLSearchParams('limit=50');
            const result = normalizeQueryParams(params);
            expect(result.limit).toBe(50);
        });

        it('should cap limit at 100', () => {
            const params = new URLSearchParams('limit=200');
            const result = normalizeQueryParams(params);
            expect(result.limit).toBe(100);
        });

        it('should ignore invalid limit', () => {
            const params = new URLSearchParams('limit=invalid');
            const result = normalizeQueryParams(params);
            expect(result.limit).toBeUndefined();
        });

        it('should ignore negative limit', () => {
            const params = new URLSearchParams('limit=-10');
            const result = normalizeQueryParams(params);
            expect(result.limit).toBeUndefined();
        });

        it('should parse skip parameter', () => {
            const params = new URLSearchParams('skip=20');
            const result = normalizeQueryParams(params);
            expect(result.skip).toBe(20);
        });

        it('should ignore negative skip', () => {
            const params = new URLSearchParams('skip=-5');
            const result = normalizeQueryParams(params);
            expect(result.skip).toBeUndefined();
        });

        it('should calculate skip from page when skip not provided', () => {
            const params = new URLSearchParams('page=3');
            const result = normalizeQueryParams(params);
            // Default limit is 20, so page 3 = skip 40
            expect(result.skip).toBe(40);
        });

        it('should calculate skip from page with custom limit', () => {
            const params = new URLSearchParams('page=2&limit=10');
            const result = normalizeQueryParams(params);
            expect(result.skip).toBe(10);
            expect(result.limit).toBe(10);
        });

        it('should prefer skip over page', () => {
            const params = new URLSearchParams('page=3&skip=5');
            const result = normalizeQueryParams(params);
            expect(result.skip).toBe(5);
        });

        it('should parse search parameter', () => {
            const params = new URLSearchParams('search=test');
            const result = normalizeQueryParams(params);
            expect(result.search).toBe('test');
        });

        it('should parse status parameter', () => {
            const params = new URLSearchParams('status=active');
            const result = normalizeQueryParams(params);
            expect(result.status).toBe('active');
        });

        it('should parse city parameter', () => {
            const params = new URLSearchParams('city=Istanbul');
            const result = normalizeQueryParams(params);
            expect(result.city).toBe('Istanbul');
        });

        it('should parse multiple parameters', () => {
            const params = new URLSearchParams('limit=25&skip=10&search=test&status=active');
            const result = normalizeQueryParams(params);
            expect(result).toEqual({
                limit: 25,
                skip: 10,
                search: 'test',
                status: 'active',
            });
        });
    });

    describe('buildQueries', () => {
        it('should return empty array for undefined params', () => {
            const result = buildQueries(undefined);
            expect(result).toEqual([]);
        });

        it('should return empty array for empty params', () => {
            const result = buildQueries({});
            expect(result).toEqual([]);
        });

        it('should build limit query', () => {
            const result = buildQueries({ limit: 50 });
            expect(result).toContain('limit(50)');
        });

        it('should build offset query from skip', () => {
            const result = buildQueries({ skip: 20 });
            expect(result).toContain('offset(20)');
        });

        it('should build status query', () => {
            const result = buildQueries({ status: 'active' });
            expect(result).toContain('equal(status,active)');
        });

        it('should build city query', () => {
            const result = buildQueries({ city: 'Ankara' });
            expect(result).toContain('equal(city,Ankara)');
        });

        it('should build search query with OR conditions', () => {
            const result = buildQueries({ search: 'test' });
            expect(result.length).toBe(1);
            expect(result[0]).toContain('or(');
        });

        it('should not build search query for empty search', () => {
            const result = buildQueries({ search: '   ' });
            expect(result).toEqual([]);
        });

        it('should build multiple queries', () => {
            const result = buildQueries({ limit: 10, skip: 5, status: 'pending' });
            expect(result).toContain('limit(10)');
            expect(result).toContain('offset(5)');
            expect(result).toContain('equal(status,pending)');
        });
    });

    describe('getDatabases', () => {
        it('should return Databases instance', () => {
            const databases = getDatabases();
            expect(databases).toBeDefined();
            expect(databases.listDocuments).toBeDefined();
            expect(databases.getDocument).toBeDefined();
            expect(databases.createDocument).toBeDefined();
            expect(databases.updateDocument).toBeDefined();
            expect(databases.deleteDocument).toBeDefined();
        });
    });

    describe('listDocuments', () => {
        it('should list documents successfully', async () => {
            const mockDocuments = [
                { $id: '1', name: 'Test 1' },
                { $id: '2', name: 'Test 2' },
            ];
            mockListDocuments.mockResolvedValue({
                documents: mockDocuments,
                total: 2,
            });

            const result = await listDocuments('beneficiaries');

            expect(result.documents).toEqual(mockDocuments);
            expect(result.total).toBe(2);
            expect(mockListDocuments).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                []
            );
        });

        it('should list documents with params', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            await listDocuments('beneficiaries', { limit: 10, status: 'active' });

            expect(mockListDocuments).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                expect.arrayContaining(['limit(10)', 'equal(status,active)'])
            );
        });

        it('should throw error on failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('Database error'));

            await expect(listDocuments('beneficiaries')).rejects.toThrow('Database error');
        });
    });

    describe('getDocument', () => {
        it('should get document successfully', async () => {
            const mockDocument = { $id: '123', name: 'Test' };
            mockGetDocument.mockResolvedValue(mockDocument);

            const result = await getDocument('beneficiaries', '123');

            expect(result).toEqual(mockDocument);
            expect(mockGetDocument).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                '123'
            );
        });

        it('should return null on not found', async () => {
            mockGetDocument.mockRejectedValue(new Error('Document not found'));

            const result = await getDocument('beneficiaries', 'nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('createDocument', () => {
        it('should create document successfully', async () => {
            const mockDocument = { $id: 'unique-id-123', name: 'New Doc' };
            mockCreateDocument.mockResolvedValue(mockDocument);

            const result = await createDocument('beneficiaries', { name: 'New Doc' });

            expect(result).toEqual(mockDocument);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                'unique-id-123',
                { name: 'New Doc' }
            );
        });

        it('should throw error on creation failure', async () => {
            mockCreateDocument.mockRejectedValue(new Error('Creation failed'));

            await expect(createDocument('beneficiaries', { name: 'Test' }))
                .rejects.toThrow('Creation failed');
        });
    });

    describe('updateDocument', () => {
        it('should update document successfully', async () => {
            const mockDocument = { $id: '123', name: 'Updated' };
            mockUpdateDocument.mockResolvedValue(mockDocument);

            const result = await updateDocument('beneficiaries', '123', { name: 'Updated' });

            expect(result).toEqual(mockDocument);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                '123',
                { name: 'Updated' }
            );
        });

        it('should throw error on update failure', async () => {
            mockUpdateDocument.mockRejectedValue(new Error('Update failed'));

            await expect(updateDocument('beneficiaries', '123', { name: 'Test' }))
                .rejects.toThrow('Update failed');
        });
    });

    describe('deleteDocument', () => {
        it('should delete document successfully', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await deleteDocument('beneficiaries', '123');

            expect(mockDeleteDocument).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                '123'
            );
        });

        it('should throw error on delete failure', async () => {
            mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));

            await expect(deleteDocument('beneficiaries', '123'))
                .rejects.toThrow('Delete failed');
        });
    });
});
