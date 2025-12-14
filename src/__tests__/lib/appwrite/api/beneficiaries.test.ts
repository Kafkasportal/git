/**
 * Beneficiaries API Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock base module
const mockListDocuments = vi.fn();
const mockGetDocument = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();
const mockGetDatabases = vi.fn();

vi.mock('@/lib/appwrite/api/base', () => ({
    listDocuments: (...args: unknown[]) => mockListDocuments(...args),
    getDocument: (...args: unknown[]) => mockGetDocument(...args),
    createDocument: (...args: unknown[]) => mockCreateDocument(...args),
    updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
    deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
    getDatabases: () => mockGetDatabases(),
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
    appwriteConfig: {
        databaseId: 'test-database',
        collections: {
            beneficiaries: 'beneficiaries-collection',
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
    Query: {
        equal: vi.fn((field: string, value: string) => `equal(${field},${value})`),
        limit: vi.fn((n: number) => `limit(${n})`),
    },
}));

// Import after mocks
import { appwriteBeneficiaries } from '@/lib/appwrite/api/beneficiaries';

describe('Beneficiaries API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list beneficiaries without params', async () => {
            const mockData = {
                documents: [{ $id: '1', name: 'Test' }],
                total: 1,
            };
            mockListDocuments.mockResolvedValue(mockData);

            const result = await appwriteBeneficiaries.list();

            expect(result).toEqual(mockData);
            expect(mockListDocuments).toHaveBeenCalledWith('beneficiaries', undefined);
        });

        it('should list beneficiaries with params', async () => {
            const mockData = { documents: [], total: 0 };
            mockListDocuments.mockResolvedValue(mockData);

            const params = { limit: 10, status: 'active' };
            await appwriteBeneficiaries.list(params);

            expect(mockListDocuments).toHaveBeenCalledWith('beneficiaries', params);
        });

        it('should propagate errors', async () => {
            mockListDocuments.mockRejectedValue(new Error('List failed'));

            await expect(appwriteBeneficiaries.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get beneficiary by id', async () => {
            const mockBeneficiary = { $id: '123', name: 'Test Beneficiary' };
            mockGetDocument.mockResolvedValue(mockBeneficiary);

            const result = await appwriteBeneficiaries.get('123');

            expect(result).toEqual(mockBeneficiary);
            expect(mockGetDocument).toHaveBeenCalledWith('beneficiaries', '123');
        });

        it('should return null for non-existent beneficiary', async () => {
            mockGetDocument.mockResolvedValue(null);

            const result = await appwriteBeneficiaries.get('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getByTcNo', () => {
        it('should get beneficiary by TC number', async () => {
            const mockBeneficiary = { $id: '123', tc_no: '12345678901', name: 'Test' };
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [mockBeneficiary],
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteBeneficiaries.getByTcNo('12345678901');

            expect(result).toEqual(mockBeneficiary);
            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'beneficiaries-collection',
                expect.arrayContaining([
                    expect.stringContaining('equal(tc_no,12345678901)'),
                    expect.stringContaining('limit(1)'),
                ])
            );
        });

        it('should return null when TC number not found', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({ documents: [] }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteBeneficiaries.getByTcNo('99999999999');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('Query failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteBeneficiaries.getByTcNo('12345678901');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create beneficiary', async () => {
            const mockCreated = { $id: 'new-id', name: 'New Beneficiary' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = {
                name: 'New Beneficiary',
                tc_no: '12345678901',
                phone: '+905551234567',
            };
            const result = await appwriteBeneficiaries.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'beneficiaries',
                expect.objectContaining({
                    name: 'New Beneficiary',
                    tc_no: '12345678901',
                    phone: '+905551234567',
                    createdAt: expect.any(String),
                })
            );
        });

        it('should create beneficiary with auth context', async () => {
            const mockCreated = { $id: 'new-id', name: 'New Beneficiary' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = { name: 'New Beneficiary', tc_no: '12345678901' };
            const context = { auth: { userId: 'user-123', role: 'admin' } };
            await appwriteBeneficiaries.create(data as never, context);

            expect(mockCreateDocument).toHaveBeenCalledWith(
                'beneficiaries',
                expect.objectContaining({
                    created_by: 'user-123',
                })
            );
        });

        it('should propagate creation errors', async () => {
            mockCreateDocument.mockRejectedValue(new Error('Creation failed'));

            await expect(appwriteBeneficiaries.create({ name: 'Test' } as never))
                .rejects.toThrow('Creation failed');
        });
    });

    describe('update', () => {
        it('should update beneficiary', async () => {
            const mockUpdated = { $id: '123', name: 'Updated Name' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteBeneficiaries.update('123', { name: 'Updated Name' } as never);

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'beneficiaries',
                '123',
                expect.objectContaining({
                    name: 'Updated Name',
                    updatedAt: expect.any(String),
                })
            );
        });

        it('should update beneficiary with auth context', async () => {
            const mockUpdated = { $id: '123', name: 'Updated' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const context = { auth: { userId: 'user-456', role: 'admin' } };
            await appwriteBeneficiaries.update('123', { name: 'Updated' } as never, context);

            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'beneficiaries',
                '123',
                expect.objectContaining({
                    updated_by: 'user-456',
                })
            );
        });

        it('should propagate update errors', async () => {
            mockUpdateDocument.mockRejectedValue(new Error('Update failed'));

            await expect(appwriteBeneficiaries.update('123', { name: 'Test' } as never))
                .rejects.toThrow('Update failed');
        });
    });

    describe('remove', () => {
        it('should delete beneficiary', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteBeneficiaries.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('beneficiaries', '123');
        });

        it('should propagate delete errors', async () => {
            mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));

            await expect(appwriteBeneficiaries.remove('123'))
                .rejects.toThrow('Delete failed');
        });
    });
});
