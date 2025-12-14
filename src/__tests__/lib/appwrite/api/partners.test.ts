/**
 * Partners API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the base module
vi.mock('@/lib/appwrite/api/base', () => ({
    getDatabases: vi.fn(() => ({
        listDocuments: vi.fn(),
    })),
    buildQueries: vi.fn(() => []),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
    appwriteConfig: {
        databaseId: 'test-db',
        collections: {
            partners: 'partners',
        },
    },
}));

import { appwritePartners } from '@/lib/appwrite/api/partners';
import * as baseModule from '@/lib/appwrite/api/base';

describe('appwritePartners', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should list partners', async () => {
            const mockDocuments = [
                { $id: '1', name: 'Partner 1', type: 'organization' },
                { $id: '2', name: 'Partner 2', type: 'individual' },
            ];

            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: mockDocuments,
                total: 2,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            const result = await appwritePartners.list();

            expect(result.documents).toEqual(mockDocuments);
            expect(result.total).toBe(2);
        });

        it('should filter by type', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwritePartners.list({ type: 'organization' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by status', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwritePartners.list({ status: 'active' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by partnership_type', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwritePartners.list({ partnership_type: 'donor' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const mockError = new Error('Database error');
            const mockListDocuments = vi.fn().mockRejectedValue(mockError);

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            await expect(appwritePartners.list()).rejects.toThrow('Database error');
        });
    });

    describe('get', () => {
        it('should get partner by id', async () => {
            const mockPartner = { $id: '1', name: 'Partner 1' };
            vi.mocked(baseModule.getDocument).mockResolvedValue(mockPartner);

            const result = await appwritePartners.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('partners', '1');
            expect(result).toEqual(mockPartner);
        });
    });

    describe('create', () => {
        it('should create partner', async () => {
            const mockCreated = { $id: 'new-1', name: 'New Partner' };
            vi.mocked(baseModule.createDocument).mockResolvedValue(mockCreated);

            const result = await appwritePartners.create({
                name: 'New Partner',
                type: 'organization',
            } as any);

            expect(baseModule.createDocument).toHaveBeenCalledWith(
                'partners',
                expect.objectContaining({
                    name: 'New Partner',
                    createdAt: expect.any(String),
                })
            );
            expect(result).toEqual(mockCreated);
        });
    });

    describe('update', () => {
        it('should update partner', async () => {
            const mockUpdated = { $id: '1', status: 'inactive' };
            vi.mocked(baseModule.updateDocument).mockResolvedValue(mockUpdated);

            const result = await appwritePartners.update('1', {
                status: 'inactive',
            } as any);

            expect(baseModule.updateDocument).toHaveBeenCalledWith(
                'partners',
                '1',
                expect.objectContaining({
                    status: 'inactive',
                    updatedAt: expect.any(String),
                })
            );
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('remove', () => {
        it('should delete partner', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);

            await appwritePartners.remove('1');

            expect(baseModule.deleteDocument).toHaveBeenCalledWith('partners', '1');
        });
    });
});
