/**
 * Users API Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock base module
const mockGetDocument = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();
const mockGetDatabases = vi.fn();

vi.mock('@/lib/appwrite/api/base', () => ({
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
            users: 'users-collection',
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
        equal: vi.fn((field: string, value: unknown) => `equal(${field},${value})`),
        limit: vi.fn((n: number) => `limit(${n})`),
        search: vi.fn((field: string, value: string) => `search(${field},${value})`),
    },
}));

// Import after mocks
import { appwriteUsers } from '@/lib/appwrite/api/users';

describe('Users API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list users without params', async () => {
            const mockUsers = [
                { $id: '1', name: 'User 1', email: 'user1@test.com' },
                { $id: '2', name: 'User 2', email: 'user2@test.com' },
            ];
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: mockUsers,
                    total: 2,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteUsers.list();

            expect(result.documents).toEqual(mockUsers);
            expect(result.total).toBe(2);
        });

        it('should list users with limit', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteUsers.list({ limit: 10 });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'users-collection',
                expect.arrayContaining(['limit(10)'])
            );
        });

        it('should list users with role filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteUsers.list({ role: 'admin' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'users-collection',
                expect.arrayContaining(['equal(role,admin)'])
            );
        });

        it('should list users with isActive filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteUsers.list({ isActive: true });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'users-collection',
                expect.arrayContaining(['equal(isActive,true)'])
            );
        });

        it('should list users with search', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteUsers.list({ search: 'john' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'users-collection',
                expect.arrayContaining(['search(name,john)'])
            );
        });

        it('should propagate errors', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await expect(appwriteUsers.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get user by id', async () => {
            const mockUser = { $id: '123', name: 'Test User', email: 'test@test.com' };
            mockGetDocument.mockResolvedValue(mockUser);

            const result = await appwriteUsers.get('123');

            expect(result).toEqual(mockUser);
            expect(mockGetDocument).toHaveBeenCalledWith('users', '123');
        });
    });

    describe('getByEmail', () => {
        it('should get user by email', async () => {
            const mockUser = { $id: '123', name: 'Test User', email: 'test@test.com' };
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [mockUser],
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteUsers.getByEmail('test@test.com');

            expect(result).toEqual(mockUser);
        });

        it('should return null when email not found', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({ documents: [] }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteUsers.getByEmail('notfound@test.com');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('Query failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteUsers.getByEmail('test@test.com');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create user', async () => {
            const mockCreated = { $id: 'new-id', name: 'New User', email: 'new@test.com' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = {
                name: 'New User',
                email: 'new@test.com',
                role: 'user',
            };
            const result = await appwriteUsers.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'users',
                expect.objectContaining({
                    name: 'New User',
                    email: 'new@test.com',
                    role: 'user',
                    createdAt: expect.any(String),
                })
            );
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            const mockUpdated = { $id: '123', name: 'Updated User' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteUsers.update('123', { name: 'Updated User' } as never);

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'users',
                '123',
                expect.objectContaining({
                    name: 'Updated User',
                    updatedAt: expect.any(String),
                })
            );
        });
    });

    describe('remove', () => {
        it('should delete user', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteUsers.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('users', '123');
        });
    });
});
