/**
 * Todos API Module Tests
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
            todos: 'todos-collection',
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
    },
}));

// Import after mocks
import { appwriteTodos } from '@/lib/appwrite/api/todos';

describe('Todos API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBuildQueries.mockReturnValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list todos without params', async () => {
            const mockTodos = [
                { $id: '1', title: 'Todo 1', completed: false },
                { $id: '2', title: 'Todo 2', completed: true },
            ];
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: mockTodos,
                    total: 2,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteTodos.list();

            expect(result.documents).toEqual(mockTodos);
            expect(result.total).toBe(2);
        });

        it('should list todos with created_by filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteTodos.list({ created_by: 'user-123' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'todos-collection',
                expect.arrayContaining(['equal(created_by,user-123)'])
            );
        });

        it('should propagate errors', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await expect(appwriteTodos.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get todo by id', async () => {
            const mockTodo = { $id: '123', title: 'Test Todo' };
            mockGetDocument.mockResolvedValue(mockTodo);

            const result = await appwriteTodos.get('123');

            expect(result).toEqual(mockTodo);
            expect(mockGetDocument).toHaveBeenCalledWith('todos', '123');
        });
    });

    describe('create', () => {
        it('should create todo', async () => {
            const mockCreated = { $id: 'new-id', title: 'New Todo' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = { title: 'New Todo', completed: false };
            const result = await appwriteTodos.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'todos',
                expect.objectContaining({
                    title: 'New Todo',
                    createdAt: expect.any(String),
                })
            );
        });
    });

    describe('update', () => {
        it('should update todo', async () => {
            const mockUpdated = { $id: '123', title: 'Updated Todo', completed: true };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteTodos.update('123', { completed: true } as never);

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'todos',
                '123',
                expect.objectContaining({
                    completed: true,
                    updatedAt: expect.any(String),
                })
            );
        });
    });

    describe('remove', () => {
        it('should delete todo', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteTodos.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('todos', '123');
        });
    });
});
