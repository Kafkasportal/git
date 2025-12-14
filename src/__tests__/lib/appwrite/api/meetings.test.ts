/**
 * Meetings API Module Tests
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
            meetings: 'meetings-collection',
            meetingDecisions: 'meeting-decisions-collection',
            meetingActionItems: 'meeting-action-items-collection',
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
    },
}));

// Import after mocks
import {
    appwriteMeetings,
    appwriteMeetingDecisions,
    appwriteMeetingActionItems,
} from '@/lib/appwrite/api/meetings';

describe('Meetings API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBuildQueries.mockReturnValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('appwriteMeetings', () => {
        describe('list', () => {
            it('should list meetings without params', async () => {
                const mockMeetings = [
                    { $id: '1', title: 'Meeting 1' },
                    { $id: '2', title: 'Meeting 2' },
                ];
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: mockMeetings,
                        total: 2,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                const result = await appwriteMeetings.list();

                expect(result.documents).toEqual(mockMeetings);
                expect(result.total).toBe(2);
            });

            it('should list meetings with organizer filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetings.list({ organizer: 'user-123' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meetings-collection',
                    expect.arrayContaining(['equal(organizer,user-123)'])
                );
            });

            it('should propagate errors', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await expect(appwriteMeetings.list()).rejects.toThrow('List failed');
            });
        });

        describe('get', () => {
            it('should get meeting by id', async () => {
                const mockMeeting = { $id: '123', title: 'Test Meeting' };
                mockGetDocument.mockResolvedValue(mockMeeting);

                const result = await appwriteMeetings.get('123');

                expect(result).toEqual(mockMeeting);
                expect(mockGetDocument).toHaveBeenCalledWith('meetings', '123');
            });
        });

        describe('create', () => {
            it('should create meeting', async () => {
                const mockCreated = { $id: 'new-id', title: 'New Meeting' };
                mockCreateDocument.mockResolvedValue(mockCreated);

                const data = { title: 'New Meeting', date: '2024-01-15' };
                const result = await appwriteMeetings.create(data as never);

                expect(result).toEqual(mockCreated);
                expect(mockCreateDocument).toHaveBeenCalledWith(
                    'meetings',
                    expect.objectContaining({
                        title: 'New Meeting',
                        createdAt: expect.any(String),
                    })
                );
            });
        });

        describe('update', () => {
            it('should update meeting', async () => {
                const mockUpdated = { $id: '123', title: 'Updated Meeting' };
                mockUpdateDocument.mockResolvedValue(mockUpdated);

                const result = await appwriteMeetings.update('123', { title: 'Updated Meeting' } as never);

                expect(result).toEqual(mockUpdated);
                expect(mockUpdateDocument).toHaveBeenCalledWith(
                    'meetings',
                    '123',
                    expect.objectContaining({
                        title: 'Updated Meeting',
                        updatedAt: expect.any(String),
                    })
                );
            });
        });

        describe('remove', () => {
            it('should delete meeting', async () => {
                mockDeleteDocument.mockResolvedValue(undefined);

                await appwriteMeetings.remove('123');

                expect(mockDeleteDocument).toHaveBeenCalledWith('meetings', '123');
            });
        });
    });

    describe('appwriteMeetingDecisions', () => {
        describe('list', () => {
            it('should list decisions without params', async () => {
                const mockDecisions = [{ $id: '1', content: 'Decision 1' }];
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: mockDecisions,
                        total: 1,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                const result = await appwriteMeetingDecisions.list();

                expect(result.documents).toEqual(mockDecisions);
            });

            it('should list decisions with meeting_id filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetingDecisions.list({ meeting_id: 'meeting-123' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meeting-decisions-collection',
                    expect.arrayContaining(['equal(meeting_id,meeting-123)'])
                );
            });

            it('should list decisions with owner filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetingDecisions.list({ owner: 'user-123' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meeting-decisions-collection',
                    expect.arrayContaining(['equal(owner,user-123)'])
                );
            });

            it('should list decisions with status filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetingDecisions.list({ status: 'acik' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meeting-decisions-collection',
                    expect.arrayContaining(['equal(status,acik)'])
                );
            });

            it('should propagate errors', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await expect(appwriteMeetingDecisions.list()).rejects.toThrow('List failed');
            });
        });

        describe('get', () => {
            it('should get decision by id', async () => {
                const mockDecision = { $id: '123', content: 'Test Decision' };
                mockGetDocument.mockResolvedValue(mockDecision);

                const result = await appwriteMeetingDecisions.get('123');

                expect(result).toEqual(mockDecision);
                expect(mockGetDocument).toHaveBeenCalledWith('meetingDecisions', '123');
            });
        });

        describe('create', () => {
            it('should create decision', async () => {
                const mockCreated = { $id: 'new-id', content: 'New Decision' };
                mockCreateDocument.mockResolvedValue(mockCreated);

                const data = { content: 'New Decision', meeting_id: 'meeting-123' };
                const result = await appwriteMeetingDecisions.create(data as never);

                expect(result).toEqual(mockCreated);
                expect(mockCreateDocument).toHaveBeenCalledWith(
                    'meetingDecisions',
                    expect.objectContaining({
                        content: 'New Decision',
                        created_at: expect.any(String),
                    })
                );
            });
        });

        describe('update', () => {
            it('should update decision', async () => {
                const mockUpdated = { $id: '123', content: 'Updated Decision' };
                mockUpdateDocument.mockResolvedValue(mockUpdated);

                const result = await appwriteMeetingDecisions.update('123', { content: 'Updated Decision' } as never);

                expect(result).toEqual(mockUpdated);
            });
        });

        describe('remove', () => {
            it('should delete decision', async () => {
                mockDeleteDocument.mockResolvedValue(undefined);

                await appwriteMeetingDecisions.remove('123');

                expect(mockDeleteDocument).toHaveBeenCalledWith('meetingDecisions', '123');
            });
        });
    });

    describe('appwriteMeetingActionItems', () => {
        describe('list', () => {
            it('should list action items without params', async () => {
                const mockItems = [{ $id: '1', title: 'Action 1' }];
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: mockItems,
                        total: 1,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                const result = await appwriteMeetingActionItems.list();

                expect(result.documents).toEqual(mockItems);
            });

            it('should list action items with meeting_id filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetingActionItems.list({ meeting_id: 'meeting-123' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meeting-action-items-collection',
                    expect.arrayContaining(['equal(meeting_id,meeting-123)'])
                );
            });

            it('should list action items with assigned_to filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetingActionItems.list({ assigned_to: 'user-123' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meeting-action-items-collection',
                    expect.arrayContaining(['equal(assigned_to,user-123)'])
                );
            });

            it('should list action items with status filter', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockResolvedValue({
                        documents: [],
                        total: 0,
                    }),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await appwriteMeetingActionItems.list({ status: 'beklemede' });

                expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                    'test-database',
                    'meeting-action-items-collection',
                    expect.arrayContaining(['equal(status,beklemede)'])
                );
            });

            it('should propagate errors', async () => {
                const mockDatabases = {
                    listDocuments: vi.fn().mockRejectedValue(new Error('List failed')),
                };
                mockGetDatabases.mockReturnValue(mockDatabases);

                await expect(appwriteMeetingActionItems.list()).rejects.toThrow('List failed');
            });
        });

        describe('get', () => {
            it('should get action item by id', async () => {
                const mockItem = { $id: '123', title: 'Test Action' };
                mockGetDocument.mockResolvedValue(mockItem);

                const result = await appwriteMeetingActionItems.get('123');

                expect(result).toEqual(mockItem);
                expect(mockGetDocument).toHaveBeenCalledWith('meetingActionItems', '123');
            });
        });

        describe('create', () => {
            it('should create action item', async () => {
                const mockCreated = { $id: 'new-id', title: 'New Action' };
                mockCreateDocument.mockResolvedValue(mockCreated);

                const data = { title: 'New Action', meeting_id: 'meeting-123' };
                const result = await appwriteMeetingActionItems.create(data as never);

                expect(result).toEqual(mockCreated);
                expect(mockCreateDocument).toHaveBeenCalledWith(
                    'meetingActionItems',
                    expect.objectContaining({
                        title: 'New Action',
                        created_at: expect.any(String),
                    })
                );
            });
        });

        describe('update', () => {
            it('should update action item', async () => {
                const mockUpdated = { $id: '123', title: 'Updated Action' };
                mockUpdateDocument.mockResolvedValue(mockUpdated);

                const result = await appwriteMeetingActionItems.update('123', { title: 'Updated Action' } as never);

                expect(result).toEqual(mockUpdated);
            });
        });

        describe('updateStatus', () => {
            it('should update action item status', async () => {
                const mockUpdated = { $id: '123', status: 'hazir' };
                mockUpdateDocument.mockResolvedValue(mockUpdated);

                const result = await appwriteMeetingActionItems.updateStatus('123', {
                    status: 'hazir',
                    changed_by: 'user-123',
                });

                expect(result).toEqual(mockUpdated);
                expect(mockUpdateDocument).toHaveBeenCalledWith(
                    'meetingActionItems',
                    '123',
                    expect.objectContaining({
                        status: 'hazir',
                        changed_by: 'user-123',
                        updatedAt: expect.any(String),
                    })
                );
            });

            it('should update action item status with note', async () => {
                const mockUpdated = { $id: '123', status: 'iptal' };
                mockUpdateDocument.mockResolvedValue(mockUpdated);

                await appwriteMeetingActionItems.updateStatus('123', {
                    status: 'iptal',
                    changed_by: 'user-123',
                    note: 'Cancelled due to priority change',
                });

                expect(mockUpdateDocument).toHaveBeenCalledWith(
                    'meetingActionItems',
                    '123',
                    expect.objectContaining({
                        status: 'iptal',
                        changed_by: 'user-123',
                        note: 'Cancelled due to priority change',
                    })
                );
            });
        });

        describe('remove', () => {
            it('should delete action item', async () => {
                mockDeleteDocument.mockResolvedValue(undefined);

                await appwriteMeetingActionItems.remove('123');

                expect(mockDeleteDocument).toHaveBeenCalledWith('meetingActionItems', '123');
            });
        });
    });
});
