/**
 * Finance Records API Tests
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
            financeRecords: 'finance_records',
        },
    },
}));

import { appwriteFinanceRecords } from '@/lib/appwrite/api/finance';
import * as baseModule from '@/lib/appwrite/api/base';

describe('appwriteFinanceRecords', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should list finance records', async () => {
            const mockDocuments = [
                { $id: '1', record_type: 'income', amount: 1000 },
                { $id: '2', record_type: 'expense', amount: 500 },
            ];

            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: mockDocuments,
                total: 2,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            const result = await appwriteFinanceRecords.list();

            expect(result.documents).toEqual(mockDocuments);
            expect(result.total).toBe(2);
        });

        it('should filter by record_type', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwriteFinanceRecords.list({ record_type: 'income' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by created_by', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: [],
                total: 0,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);
            vi.mocked(baseModule.buildQueries).mockReturnValue([]);

            await appwriteFinanceRecords.list({ created_by: 'user-123' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const mockError = new Error('Database error');
            const mockListDocuments = vi.fn().mockRejectedValue(mockError);

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            await expect(appwriteFinanceRecords.list()).rejects.toThrow('Database error');
        });
    });

    describe('get', () => {
        it('should get finance record by id', async () => {
            const mockRecord = { $id: '1', record_type: 'income', amount: 1000 };
            vi.mocked(baseModule.getDocument).mockResolvedValue(mockRecord);

            const result = await appwriteFinanceRecords.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('financeRecords', '1');
            expect(result).toEqual(mockRecord);
        });
    });

    describe('create', () => {
        it('should create finance record', async () => {
            const mockCreated = { $id: 'new-1', record_type: 'income', amount: 1000 };
            vi.mocked(baseModule.createDocument).mockResolvedValue(mockCreated);

            const result = await appwriteFinanceRecords.create({
                record_type: 'income',
                amount: 1000,
                description: 'Donation',
            } as any);

            expect(baseModule.createDocument).toHaveBeenCalledWith(
                'financeRecords',
                expect.objectContaining({
                    record_type: 'income',
                    amount: 1000,
                    createdAt: expect.any(String),
                })
            );
            expect(result).toEqual(mockCreated);
        });
    });

    describe('update', () => {
        it('should update finance record', async () => {
            const mockUpdated = { $id: '1', amount: 1500 };
            vi.mocked(baseModule.updateDocument).mockResolvedValue(mockUpdated);

            const result = await appwriteFinanceRecords.update('1', {
                amount: 1500,
            } as any);

            expect(baseModule.updateDocument).toHaveBeenCalledWith(
                'financeRecords',
                '1',
                expect.objectContaining({
                    amount: 1500,
                    updatedAt: expect.any(String),
                })
            );
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('remove', () => {
        it('should delete finance record', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);

            await appwriteFinanceRecords.remove('1');

            expect(baseModule.deleteDocument).toHaveBeenCalledWith('financeRecords', '1');
        });
    });
});
