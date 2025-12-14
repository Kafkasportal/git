/**
 * Workflow Notifications API Module Tests
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
            workflowNotifications: 'workflow-notifications-collection',
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
import { appwriteWorkflowNotifications } from '@/lib/appwrite/api/notifications';

describe('Workflow Notifications API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('list', () => {
        it('should list notifications without params', async () => {
            const mockNotifications = [
                { $id: '1', title: 'Notification 1' },
                { $id: '2', title: 'Notification 2' },
            ];
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: mockNotifications,
                    total: 2,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            const result = await appwriteWorkflowNotifications.list();

            expect(result.documents).toEqual(mockNotifications);
            expect(result.total).toBe(2);
        });

        it('should list notifications with recipient filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteWorkflowNotifications.list({ recipient: 'user-123' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'workflow-notifications-collection',
                expect.arrayContaining(['equal(recipient,user-123)'])
            );
        });

        it('should list notifications with status filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteWorkflowNotifications.list({ status: 'beklemede' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'workflow-notifications-collection',
                expect.arrayContaining(['equal(status,beklemede)'])
            );
        });

        it('should list notifications with category filter', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockResolvedValue({
                    documents: [],
                    total: 0,
                }),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await appwriteWorkflowNotifications.list({ category: 'meeting' });

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test-database',
                'workflow-notifications-collection',
                expect.arrayContaining(['equal(category,meeting)'])
            );
        });

        it('should propagate errors', async () => {
            const mockDatabases = {
                listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
            };
            mockGetDatabases.mockReturnValue(mockDatabases);

            await expect(appwriteWorkflowNotifications.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should get notification by id', async () => {
            const mockNotification = { $id: '123', title: 'Test Notification' };
            mockGetDocument.mockResolvedValue(mockNotification);

            const result = await appwriteWorkflowNotifications.get('123');

            expect(result).toEqual(mockNotification);
            expect(mockGetDocument).toHaveBeenCalledWith('workflowNotifications', '123');
        });
    });

    describe('create', () => {
        it('should create notification', async () => {
            const mockCreated = { $id: 'new-id', title: 'New Notification' };
            mockCreateDocument.mockResolvedValue(mockCreated);

            const data = { title: 'New Notification', recipient: 'user-123' };
            const result = await appwriteWorkflowNotifications.create(data as never);

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument).toHaveBeenCalledWith(
                'workflowNotifications',
                expect.objectContaining({
                    title: 'New Notification',
                    created_at: expect.any(String),
                })
            );
        });
    });

    describe('markAsSent', () => {
        it('should mark notification as sent with auto timestamp', async () => {
            const mockUpdated = { $id: '123', status: 'gonderildi' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteWorkflowNotifications.markAsSent('123');

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'workflowNotifications',
                '123',
                expect.objectContaining({
                    status: 'gonderildi',
                    sent_at: expect.any(String),
                })
            );
        });

        it('should mark notification as sent with custom timestamp', async () => {
            const mockUpdated = { $id: '123', status: 'gonderildi' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const customTime = '2024-01-15T10:00:00Z';
            await appwriteWorkflowNotifications.markAsSent('123', customTime);

            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'workflowNotifications',
                '123',
                expect.objectContaining({
                    status: 'gonderildi',
                    sent_at: customTime,
                })
            );
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read with auto timestamp', async () => {
            const mockUpdated = { $id: '123', status: 'okundu' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const result = await appwriteWorkflowNotifications.markAsRead('123');

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'workflowNotifications',
                '123',
                expect.objectContaining({
                    status: 'okundu',
                    read_at: expect.any(String),
                })
            );
        });

        it('should mark notification as read with custom timestamp', async () => {
            const mockUpdated = { $id: '123', status: 'okundu' };
            mockUpdateDocument.mockResolvedValue(mockUpdated);

            const customTime = '2024-01-15T12:00:00Z';
            await appwriteWorkflowNotifications.markAsRead('123', customTime);

            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'workflowNotifications',
                '123',
                expect.objectContaining({
                    status: 'okundu',
                    read_at: customTime,
                })
            );
        });
    });

    describe('remove', () => {
        it('should delete notification', async () => {
            mockDeleteDocument.mockResolvedValue(undefined);

            await appwriteWorkflowNotifications.remove('123');

            expect(mockDeleteDocument).toHaveBeenCalledWith('workflowNotifications', '123');
        });
    });
});
