/**
 * Donations API Module Tests
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
            donations: 'donations-collection',
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
import { appwriteDonations } from '@/lib/appwrite/api/donations';

describe('Donations API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list donations without params', async () => {
            const mockData = {
                documents: [{ $id: '1', amount: 1000 }],
                total: 1,
            };
            mockListDocuments.mockResolvedValue(mockData);

            const result = await appwriteDonations.list();

            expect(result).toEqual(mockData);
            expect(mockListDocuments).toHaveBeenCalledWith('donations', undefined);
        });

        it('should list donations with params', async () => {
            const mockData = { documents: [], total: 0 };
            mockListDocuments.mockResolvedValue(mockData);

            const params = { limit: 20, status: 'completed' };
            await appwriteDonations.list(params);

            expect(mockListDocuments).toHaveBeenCalledWith('donations', params);
        });

        it('should propagate errors', async () => {
            mockListDocuments.mockRejectedValue(new Error('List failed'));

            await expect(appwriteDonations.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get donation by id', async () => {
            const mockDonation = { $id: '123', amount: 5000, donor_name: 'Test Donor' };
            mockGetDocument.mockResolvedValue(mockDonation);

            const result = await appwriteDonations.get('123');

            expect(result).toEqual(mockDonation);
            expect(mockGetDocument).toHaveBeenCalledWith('donations', '123');
        });

        it('should return null for non-existent donation', async () => {
            mockGetDocument.mockResolvedValue(null);

            const result = await appwriteDonations.get('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getByReceiptNumber', () => {
        it('should get donation by receipt number', async () => {
            const mockDonation = { $id: '123', receipt_number: 'RCP-001', amount: 1000 };
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [mockDonation],
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteDonations.getByReceiptNumber('RCP-001');

            expect(result).toEqual(mockDonation);
            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'donations-collection',
                expect.arrayContaining([
                    expect.stringContaining('equal(receipt_number,RCP-001)'),
                    expect.stringContaining('limit(1)'),
                ])
            );
        });

        it('should return null when receipt number not found', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({ documents: [] }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteDonations.getByReceiptNumber('NONEXISTENT');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('Query failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteDonations.getByReceiptNumber('RCP-001');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create donation', async () => {
            const mockCreated = { $id: 'new-id', amount: 2500, donor_name: 'New Donor' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = {
                amount: 2500,
                donor_name: 'New Donor',
                donation_type: 'cash',
            };
            const result = await appwriteDonations.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'donations',
                expect.objectContaining({
                    amount: 2500,
                    donor_name: 'New Donor',
                    donation_type: 'cash',
                    createdAt: expect.any(String),
                })
            );
        });

        it('should propagate creation errors', async () => {
            mockCreateDocument.mockRejectedValue(new Error('Creation failed'));

            await expect(appwriteDonations.create({ amount: 1000 } as never))
                .rejects.toThrow('Creation failed');
        });
    });

    describe('update', () => {
        it('should update donation', async () => {
            const mockUpdated = { $id: '123', amount: 3000 };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteDonations.update('123', { amount: 3000 } as never);

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'donations',
                '123',
                expect.objectContaining({
                    amount: 3000,
                    updatedAt: expect.any(String),
                })
            );
        });

        it('should propagate update errors', async () => {
            mockUpdateDocument.mockRejectedValue(new Error('Update failed'));

            await expect(appwriteDonations.update('123', { amount: 1000 } as never))
                .rejects.toThrow('Update failed');
        });
    });

    describe('remove', () => {
        it('should delete donation', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteDonations.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('donations', '123');
        });

        it('should propagate delete errors', async () => {
            mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));

            await expect(appwriteDonations.remove('123'))
                .rejects.toThrow('Delete failed');
        });
    });
});
