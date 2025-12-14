/**
 * Scholarships API Tests
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
            scholarships: 'scholarships',
            scholarshipApplications: 'scholarship_applications',
            scholarshipPayments: 'scholarship_payments',
        },
    },
}));

import {
    appwriteScholarships,
    appwriteScholarshipApplications,
    appwriteScholarshipPayments,
} from '@/lib/appwrite/api/scholarships';
import * as baseModule from '@/lib/appwrite/api/base';

describe('appwriteScholarships', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should list scholarships', async () => {
            const mockDocuments = [{ $id: '1', name: 'Scholarship 1' }];
            const mockListDocuments = vi.fn().mockResolvedValue({
                documents: mockDocuments,
                total: 1,
            });

            vi.mocked(baseModule.getDatabases).mockReturnValue({
                listDocuments: mockListDocuments,
            } as any);

            const result = await appwriteScholarships.list();

            expect(result.documents).toEqual(mockDocuments);
            expect(result.total).toBe(1);
        });

        it('should filter by category', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarships.list({ category: 'education' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by isActive', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarships.list({ isActive: true });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const mockListDocuments = vi.fn().mockRejectedValue(new Error('Database error'));
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await expect(appwriteScholarships.list()).rejects.toThrow('Database error');
        });
    });

    describe('get', () => {
        it('should get scholarship by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });
            const result = await appwriteScholarships.get('1') as { $id: string };
            expect(baseModule.getDocument).toHaveBeenCalledWith('scholarships', '1');
            expect(result.$id).toBe('1');
        });
    });

    describe('create', () => {
        it('should create scholarship', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: 'new-1' });
            const result = await appwriteScholarships.create({ name: 'New Scholarship' }) as { $id: string };
            expect(baseModule.createDocument).toHaveBeenCalledWith('scholarships', expect.objectContaining({ name: 'New Scholarship', createdAt: expect.any(String) }));
            expect(result.$id).toBe('new-1');
        });
    });

    describe('update', () => {
        it('should update scholarship', async () => {
            vi.mocked(baseModule.updateDocument).mockResolvedValue({ $id: '1' });
            const result = await appwriteScholarships.update('1', { name: 'Updated' }) as { $id: string };
            expect(baseModule.updateDocument).toHaveBeenCalledWith('scholarships', '1', expect.objectContaining({ name: 'Updated', updatedAt: expect.any(String) }));
            expect(result.$id).toBe('1');
        });
    });

    describe('remove', () => {
        it('should delete scholarship', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);
            await appwriteScholarships.remove('1');
            expect(baseModule.deleteDocument).toHaveBeenCalledWith('scholarships', '1');
        });
    });

    describe('getStatistics', () => {
        it('should get statistics', async () => {
            const mockListDocuments = vi.fn()
                .mockResolvedValueOnce({ total: 100 })
                .mockResolvedValueOnce({ total: 50 })
                .mockResolvedValueOnce({ total: 30 })
                .mockResolvedValueOnce({ total: 20 });

            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            const result = await appwriteScholarships.getStatistics();

            expect(result.total_applications).toBe(100);
            expect(result.approved).toBe(50);
            expect(result.pending).toBe(30);
            expect(result.rejected).toBe(20);
        });

        it('should get statistics for specific scholarship', async () => {
            const mockListDocuments = vi.fn()
                .mockResolvedValueOnce({ total: 10 })
                .mockResolvedValueOnce({ total: 5 })
                .mockResolvedValueOnce({ total: 3 })
                .mockResolvedValueOnce({ total: 2 });

            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            const result = await appwriteScholarships.getStatistics('scholarship-1');

            expect(result.total_applications).toBe(10);
        });

        it('should handle errors', async () => {
            const mockListDocuments = vi.fn().mockRejectedValue(new Error('Database error'));
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await expect(appwriteScholarships.getStatistics()).rejects.toThrow('Database error');
        });
    });
});

describe('appwriteScholarshipApplications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should list applications', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipApplications.list();

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by scholarship_id', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipApplications.list({ scholarship_id: 'sch-1' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by status', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipApplications.list({ status: 'pending' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by tc_no', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipApplications.list({ tc_no: '12345678901' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const mockListDocuments = vi.fn().mockRejectedValue(new Error('Database error'));
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await expect(appwriteScholarshipApplications.list()).rejects.toThrow('Database error');
        });
    });

    describe('get', () => {
        it('should get application by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });
            await appwriteScholarshipApplications.get('1');
            expect(baseModule.getDocument).toHaveBeenCalledWith('scholarshipApplications', '1');
        });
    });

    describe('create', () => {
        it('should create application with default status', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: 'new-1' });
            await appwriteScholarshipApplications.create({ applicant_name: 'Test' });
            expect(baseModule.createDocument).toHaveBeenCalledWith('scholarshipApplications', expect.objectContaining({ status: 'draft' }));
        });

        it('should create application with provided status', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: 'new-1' });
            await appwriteScholarshipApplications.create({ applicant_name: 'Test', status: 'submitted' });
            expect(baseModule.createDocument).toHaveBeenCalledWith('scholarshipApplications', expect.objectContaining({ status: 'submitted' }));
        });
    });

    describe('update', () => {
        it('should update application', async () => {
            vi.mocked(baseModule.updateDocument).mockResolvedValue({ $id: '1' });
            await appwriteScholarshipApplications.update('1', { status: 'approved' });
            expect(baseModule.updateDocument).toHaveBeenCalledWith('scholarshipApplications', '1', expect.objectContaining({ status: 'approved' }));
        });
    });

    describe('remove', () => {
        it('should delete application', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);
            await appwriteScholarshipApplications.remove('1');
            expect(baseModule.deleteDocument).toHaveBeenCalledWith('scholarshipApplications', '1');
        });
    });

    describe('submit', () => {
        it('should submit application', async () => {
            vi.mocked(baseModule.updateDocument).mockResolvedValue({ $id: '1', status: 'submitted' });
            const result = await appwriteScholarshipApplications.submit('1') as { status: string };
            expect(baseModule.updateDocument).toHaveBeenCalledWith('scholarshipApplications', '1', expect.objectContaining({ status: 'submitted', submitted_at: expect.any(String) }));
            expect(result.status).toBe('submitted');
        });
    });
});

describe('appwriteScholarshipPayments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should list payments', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipPayments.list();

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by application_id', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipPayments.list({ application_id: 'app-1' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should filter by status', async () => {
            const mockListDocuments = vi.fn().mockResolvedValue({ documents: [], total: 0 });
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await appwriteScholarshipPayments.list({ status: 'completed' });

            expect(mockListDocuments).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const mockListDocuments = vi.fn().mockRejectedValue(new Error('Database error'));
            vi.mocked(baseModule.getDatabases).mockReturnValue({ listDocuments: mockListDocuments } as any);

            await expect(appwriteScholarshipPayments.list()).rejects.toThrow('Database error');
        });
    });

    describe('get', () => {
        it('should get payment by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });
            await appwriteScholarshipPayments.get('1');
            expect(baseModule.getDocument).toHaveBeenCalledWith('scholarshipPayments', '1');
        });
    });

    describe('create', () => {
        it('should create payment with default status', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: 'new-1' });
            await appwriteScholarshipPayments.create({ amount: 1000 });
            expect(baseModule.createDocument).toHaveBeenCalledWith('scholarshipPayments', expect.objectContaining({ status: 'pending' }));
        });

        it('should create payment with provided status', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: 'new-1' });
            await appwriteScholarshipPayments.create({ amount: 1000, status: 'completed' });
            expect(baseModule.createDocument).toHaveBeenCalledWith('scholarshipPayments', expect.objectContaining({ status: 'completed' }));
        });
    });

    describe('update', () => {
        it('should update payment', async () => {
            vi.mocked(baseModule.updateDocument).mockResolvedValue({ $id: '1' });
            await appwriteScholarshipPayments.update('1', { status: 'completed' });
            expect(baseModule.updateDocument).toHaveBeenCalledWith('scholarshipPayments', '1', expect.objectContaining({ status: 'completed' }));
        });
    });

    describe('remove', () => {
        it('should delete payment', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);
            await appwriteScholarshipPayments.remove('1');
            expect(baseModule.deleteDocument).toHaveBeenCalledWith('scholarshipPayments', '1');
        });
    });
});
