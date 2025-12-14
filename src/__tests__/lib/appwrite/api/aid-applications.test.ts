/**
 * Aid Applications API Tests
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
            aidApplications: 'aid_applications',
        },
    },
}));

import { appwriteAidApplications } from '@/lib/appwrite/api/aid-applications';
import * as baseModule from '@/lib/appwrite/api/base';

describe('appwriteAidApplications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should list aid applications', async () => {
            const mockDocuments = [
                { $id: '1', beneficiary_id: 'ben-1', stage: 'pending' },
                { $id: '2', beneficiary_id: 'ben-2', stage: 'approved' },
            ];

            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: mockDocuments,
                total: 2,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            const result = await appwriteAidApplications.list();

            expect(result.documents).toEqual(mockDocuments);
            expect(result.total).toBe(2);
        });

        it('should filter by stage', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwriteAidApplications.list({ stage: 'pending' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by beneficiary_id', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwriteAidApplications.list({ beneficiary_id: 'ben-123' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const mockError = new Error('Database error');
            const mockListDocuments = vi.fn().mockRejectedValue(mockError);

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            await expect(appwriteAidApplications.list()).rejects.toThrow('Database error');
        });
    });

    describe('get', () => {
        it('should get aid application by id', async () => {
            const mockApplication = { $id: '1', beneficiary_id: 'ben-1' };
            vi.mocked(baseModule.getDocument).mockResolvedValue(mockApplication);

            const result = await appwriteAidApplications.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('aidApplications', '1');
            expect(result).toEqual(mockApplication);
        });
    });

    describe('create', () => {
        it('should create aid application', async () => {
            const mockCreated = { $id: 'new-1', beneficiary_id: 'ben-1' };
            vi.mocked(baseModule.createDocument).mockResolvedValue(mockCreated);

            const result = await appwriteAidApplications.create({
                beneficiary_id: 'ben-1',
                aid_type: 'financial',
                requested_amount: 1000,
            } as any);

            expect(baseModule.createDocument).toHaveBeenCalledWith(
                'aidApplications',
                expect.objectContaining({
                    beneficiary_id: 'ben-1',
                    createdAt: expect.any(String),
                })
            );
            expect(result).toEqual(mockCreated);
        });
    });

    describe('update', () => {
        it('should update aid application', async () => {
            const mockUpdated = { $id: '1', stage: 'approved' };
            vi.mocked(baseModule.updateDocument).mockResolvedValue(mockUpdated);

            const result = await appwriteAidApplications.update('1', {
                stage: 'approved',
            } as any);

            expect(baseModule.updateDocument).toHaveBeenCalledWith(
                'aidApplications',
                '1',
                expect.objectContaining({
                    stage: 'approved',
                    updatedAt: expect.any(String),
                })
            );
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('remove', () => {
        it('should delete aid application', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue({ success: true });

            const result = await appwriteAidApplications.remove('1');

            expect(baseModule.deleteDocument).toHaveBeenCalledWith('aidApplications', '1');
            expect(result).toEqual({ success: true });
        });
    });
});
