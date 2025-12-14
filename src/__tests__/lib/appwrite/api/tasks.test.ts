/**
 * Tasks API Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock base module
const mockGetDocument = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();
const mockGetDatabases = vi.fn();
const mockBuildQueries = vi.fn();

vi.mock('@/lib/appwrite/api/base', () => ({
    getDocument: (...args: unknown[]) => mockGetDocument(...args),
    createDocument: (...args: unknown[]) => mockCreateDocument(...args),
    updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
    deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
    getDatabases: () => mockGetDatabases(),
    buildQueries: (...args: unknown[]) => mockBuildQueries(...args),
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
    appwriteConfig: {
        databaseId: 'test-database',
        collections: {
            tasks: 'tasks-collection',
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
import { appwriteTasks } from '@/lib/appwrite/api/tasks';

describe('Tasks API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBuildQueries.mockReturnValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list tasks without params', async () => {
            const mockTasks = [
                { $id: '1', title: 'Task 1', status: 'pending' },
                { $id: '2', title: 'Task 2', status: 'completed' },
            ];
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: mockTasks,
                    total: 2,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteTasks.list();

            expect(result.documents).toEqual(mockTasks);
            expect(result.total).toBe(2);
            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'tasks-collection',
                []
            );
        });

        it('should list tasks with assigned_to filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteTasks.list({ assigned_to: 'user-123' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'tasks-collection',
                expect.arrayContaining(['equal(assigned_to,user-123)'])
            );
        });

        it('should list tasks with created_by filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteTasks.list({ created_by: 'user-456' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'tasks-collection',
                expect.arrayContaining(['equal(created_by,user-456)'])
            );
        });

        it('should list tasks with multiple filters', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteTasks.list({
                assigned_to: 'user-123',
                created_by: 'user-456',
                status: 'pending',
            });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'tasks-collection',
                expect.arrayContaining([
                    'equal(assigned_to,user-123)',
                    'equal(created_by,user-456)',
                ])
            );
        });

        it('should propagate errors', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await expect(appwriteTasks.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get task by id', async () => {
            const mockTask = { $id: '123', title: 'Test Task', status: 'pending' };
            mockGetDocument.mockResolvedValue(mockTask);

            const result = await appwriteTasks.get('123');

            expect(result).toEqual(mockTask);
            expect(mockGetDocument).toHaveBeenCalledWith('tasks', '123');
        });

        it('should return null for non-existent task', async () => {
            mockGetDocument.mockResolvedValue(null);

            const result = await appwriteTasks.get('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create task', async () => {
            const mockCreated = { $id: 'new-id', title: 'New Task', status: 'pending' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = {
                title: 'New Task',
                description: 'Task description',
                status: 'pending',
                priority: 'high',
            };
            const result = await appwriteTasks.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'tasks',
                expect.objectContaining({
                    title: 'New Task',
                    description: 'Task description',
                    status: 'pending',
                    priority: 'high',
                    createdAt: expect.any(String),
                })
            );
        });

        it('should propagate creation errors', async () => {
            mockCreateDocument.mockRejectedValue(new Error('Creation failed'));

            await expect(appwriteTasks.create({ title: 'Test' } as never))
                .rejects.toThrow('Creation failed');
        });
    });

    describe('update', () => {
        it('should update task', async () => {
            const mockUpdated = { $id: '123', title: 'Updated Task', status: 'completed' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteTasks.update('123', { status: 'completed' } as never);

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'tasks',
                '123',
                expect.objectContaining({
                    status: 'completed',
                    updatedAt: expect.any(String),
                })
            );
        });

        it('should propagate update errors', async () => {
            mockUpdateDocument.mockRejectedValue(new Error('Update failed'));

            await expect(appwriteTasks.update('123', { status: 'completed' } as never))
                .rejects.toThrow('Update failed');
        });
    });

    describe('remove', () => {
        it('should delete task', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteTasks.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('tasks', '123');
        });

        it('should propagate delete errors', async () => {
            mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));

            await expect(appwriteTasks.remove('123'))
                .rejects.toThrow('Delete failed');
        });
    });
});
