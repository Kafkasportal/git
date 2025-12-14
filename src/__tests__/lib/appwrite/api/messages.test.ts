/**
 * Messages API Module Tests
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
            messages: 'messages-collection',
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
import { appwriteMessages } from '@/lib/appwrite/api/messages';

describe('Messages API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBuildQueries.mockReturnValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list messages without params', async () => {
            const mockMessages = [
                { $id: '1', subject: 'Message 1' },
                { $id: '2', subject: 'Message 2' },
            ];
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: mockMessages,
                    total: 2,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteMessages.list();

            expect(result.documents).toEqual(mockMessages);
            expect(result.total).toBe(2);
        });

        it('should list messages with sender filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteMessages.list({ sender: 'user-123' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'messages-collection',
                expect.arrayContaining(['equal(sender,user-123)'])
            );
        });

        it('should list messages with recipient filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteMessages.list({ recipient: 'user-456' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'messages-collection',
                expect.arrayContaining(['equal(recipients,user-456)'])
            );
        });

        it('should propagate errors', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await expect(appwriteMessages.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get message by id', async () => {
            const mockMessage = { $id: '123', subject: 'Test Message' };
            mockGetDocument.mockResolvedValue(mockMessage);

            const result = await appwriteMessages.get('123');

            expect(result).toEqual(mockMessage);
            expect(mockGetDocument).toHaveBeenCalledWith('messages', '123');
        });
    });

    describe('create', () => {
        it('should create message', async () => {
            const mockCreated = { $id: 'new-id', subject: 'New Message' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = { subject: 'New Message', body: 'Message body' };
            const result = await appwriteMessages.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'messages',
                expect.objectContaining({
                    subject: 'New Message',
                    sent_at: expect.any(String),
                })
            );
        });
    });

    describe('update', () => {
        it('should update message', async () => {
            const mockUpdated = { $id: '123', subject: 'Updated Message' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteMessages.update('123', { subject: 'Updated Message' } as never);

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'messages',
                '123',
                expect.objectContaining({
                    subject: 'Updated Message',
                    updatedAt: expect.any(String),
                })
            );
        });
    });

    describe('remove', () => {
        it('should delete message', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteMessages.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('messages', '123');
        });
    });
});
