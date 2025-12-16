/**
 * Appwrite System Settings API Tests
 * Tests for lib/appwrite/api/settings.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to declare mock functions before vi.mock hoisting
const {
    mockListDocuments,
    mockGetDocument,
    mockCreateDocument,
    mockUpdateDocument,
    mockDeleteDocument,
    mockGetDocument_base,
    mockCreateDocument_base,
    mockUpdateDocument_base,
    mockDeleteDocument_base,
} = vi.hoisted(() => ({
    mockListDocuments: vi.fn(),
    mockGetDocument: vi.fn(),
    mockCreateDocument: vi.fn(),
    mockUpdateDocument: vi.fn(),
    mockDeleteDocument: vi.fn(),
    mockGetDocument_base: vi.fn(),
    mockCreateDocument_base: vi.fn(),
    mockUpdateDocument_base: vi.fn(),
    mockDeleteDocument_base: vi.fn(),
}));

vi.mock('node-appwrite', () => {
    return {
        Databases: class {
            listDocuments = mockListDocuments;
            getDocument = mockGetDocument;
            createDocument = mockCreateDocument;
            updateDocument = mockUpdateDocument;
            deleteDocument = mockDeleteDocument;
        },
    };
});

// Mock server client
vi.mock('@/lib/appwrite/server', () => ({
    serverClient: {
        config: {
            endpoint: 'https://test.appwrite.io/v1',
            project: 'test-project',
        },
    },
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
    appwriteConfig: {
        databaseId: 'test-database',
        collections: {
            systemSettings: 'system-settings-collection',
            themePresets: 'theme-presets-collection',
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

// Mock appwrite Query and ID
vi.mock('appwrite', () => ({
    ID: {
        unique: vi.fn(() => 'unique-id-123'),
    },
    Query: {
        limit: vi.fn((n: number) => `limit(${n})`),
        equal: vi.fn((field: string, value: unknown) => `equal(${field},${value})`),
    },
}));

// Mock base functions
vi.mock('@/lib/appwrite/api/base', () => ({
    getDatabases: vi.fn(() => ({
        listDocuments: mockListDocuments,
        getDocument: mockGetDocument,
        createDocument: mockCreateDocument,
        updateDocument: mockUpdateDocument,
        deleteDocument: mockDeleteDocument,
    })),
    getDocument: mockGetDocument_base,
    createDocument: mockCreateDocument_base,
    updateDocument: mockUpdateDocument_base,
    deleteDocument: mockDeleteDocument_base,
}));

// Import after mocks
import { appwriteSystemSettings, appwriteThemePresets } from '@/lib/appwrite/api/settings';

describe('appwriteSystemSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAll', () => {
        it('should return grouped settings by category', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [
                    { category: 'general', key: 'theme', value: 'dark' },
                    { category: 'general', key: 'language', value: 'tr' },
                    { category: 'notifications', key: 'email', value: true },
                ],
                total: 3,
            });

            const result = await appwriteSystemSettings.getAll();

            expect(result).toEqual({
                general: { theme: 'dark', language: 'tr' },
                notifications: { email: true },
            });
            expect(mockListDocuments).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                []
            );
        });

        it('should return empty object when no settings exist', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteSystemSettings.getAll();

            expect(result).toEqual({});
        });

        it('should throw error on database failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('Database error'));

            await expect(appwriteSystemSettings.getAll()).rejects.toThrow('Database error');
        });
    });

    describe('getByCategory', () => {
        it('should return settings for specific category', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [
                    { key: 'theme', value: 'dark' },
                    { key: 'language', value: 'tr' },
                ],
                total: 2,
            });

            const result = await appwriteSystemSettings.getByCategory('general');

            expect(result).toEqual({ theme: 'dark', language: 'tr' });
            expect(mockListDocuments).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                ['equal(category,general)']
            );
        });

        it('should return empty object for non-existent category', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteSystemSettings.getByCategory('nonexistent');

            expect(result).toEqual({});
        });

        it('should throw error on failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('Query failed'));

            await expect(appwriteSystemSettings.getByCategory('general')).rejects.toThrow('Query failed');
        });
    });

    describe('get', () => {
        it('should return value for category+key pair', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [{ value: 'dark' }],
                total: 1,
            });

            const result = await appwriteSystemSettings.get('general', 'theme');

            expect(result).toBe('dark');
        });

        it('should return null when setting not found', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteSystemSettings.get('general', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockListDocuments.mockRejectedValue(new Error('Query failed'));

            const result = await appwriteSystemSettings.get('general', 'theme');

            expect(result).toBeNull();
        });
    });

    describe('getSetting', () => {
        it('should return full document for category+key pair', async () => {
            const mockDoc = { $id: 'doc-123', category: 'general', key: 'theme', value: 'dark' };
            mockListDocuments.mockResolvedValue({
                documents: [mockDoc],
                total: 1,
            });

            const result = await appwriteSystemSettings.getSetting('general', 'theme');

            expect(result).toEqual(mockDoc);
        });

        it('should return null when not found', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteSystemSettings.getSetting('general', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockListDocuments.mockRejectedValue(new Error('Error'));

            const result = await appwriteSystemSettings.getSetting('general', 'theme');

            expect(result).toBeNull();
        });
    });

    describe('updateSettings', () => {
        it('should update existing settings', async () => {
            const existingDoc = { $id: 'existing-doc-id' };
            mockListDocuments.mockResolvedValue({
                documents: [existingDoc],
                total: 1,
            });
            mockUpdateDocument.mockResolvedValue({});

            const result = await appwriteSystemSettings.updateSettings('general', {
                theme: 'light',
            });

            expect(result).toEqual({ success: true });
            expect(mockUpdateDocument).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                'existing-doc-id',
                expect.objectContaining({
                    category: 'general',
                    key: 'theme',
                    value: 'light',
                })
            );
        });

        it('should create new settings when not exists', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });
            mockCreateDocument.mockResolvedValue({});

            const result = await appwriteSystemSettings.updateSettings('general', {
                newSetting: 'value',
            });

            expect(result).toEqual({ success: true });
            expect(mockCreateDocument).toHaveBeenCalled();
        });

        it('should handle multiple settings in batch', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });
            mockCreateDocument.mockResolvedValue({});

            const result = await appwriteSystemSettings.updateSettings('general', {
                setting1: 'value1',
                setting2: 'value2',
                setting3: 'value3',
            });

            expect(result).toEqual({ success: true });
            expect(mockCreateDocument).toHaveBeenCalledTimes(3);
        });

        it('should include updatedBy when provided', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });
            mockCreateDocument.mockResolvedValue({});

            await appwriteSystemSettings.updateSettings('general', { theme: 'dark' }, 'user-123');

            expect(mockCreateDocument).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                'unique-id-123',
                expect.objectContaining({
                    updated_by: 'user-123',
                })
            );
        });

        it('should throw error on failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('Update failed'));

            await expect(
                appwriteSystemSettings.updateSettings('general', { theme: 'dark' })
            ).rejects.toThrow('Update failed');
        });
    });

    describe('updateSetting', () => {
        it('should update single existing setting', async () => {
            const existingDoc = { $id: 'doc-id' };
            mockListDocuments.mockResolvedValue({
                documents: [existingDoc],
                total: 1,
            });
            mockUpdateDocument.mockResolvedValue({});

            const result = await appwriteSystemSettings.updateSetting('general', 'theme', 'dark');

            expect(result).toEqual({ success: true });
            expect(mockUpdateDocument).toHaveBeenCalled();
        });

        it('should create new setting when not exists', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });
            mockCreateDocument.mockResolvedValue({});

            const result = await appwriteSystemSettings.updateSetting('general', 'newKey', 'value');

            expect(result).toEqual({ success: true });
            expect(mockCreateDocument).toHaveBeenCalled();
        });

        it('should include updatedBy when provided', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });
            mockCreateDocument.mockResolvedValue({});

            await appwriteSystemSettings.updateSetting('general', 'theme', 'dark', 'admin-user');

            expect(mockCreateDocument).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                'unique-id-123',
                expect.objectContaining({
                    updated_by: 'admin-user',
                })
            );
        });

        it('should throw error on failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('Failed'));

            await expect(
                appwriteSystemSettings.updateSetting('general', 'theme', 'dark')
            ).rejects.toThrow('Failed');
        });
    });

    describe('resetSettings', () => {
        it('should delete all settings when no category specified', async () => {
            const mockDocs = [
                { $id: 'doc-1' },
                { $id: 'doc-2' },
                { $id: 'doc-3' },
            ];
            mockListDocuments.mockResolvedValue({
                documents: mockDocs,
                total: 3,
            });
            mockDeleteDocument.mockResolvedValue(undefined);

            const result = await appwriteSystemSettings.resetSettings();

            expect(result).toEqual({ success: true });
            expect(mockDeleteDocument).toHaveBeenCalledTimes(3);
            expect(mockListDocuments).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                []
            );
        });

        it('should delete only category-specific settings', async () => {
            const mockDocs = [{ $id: 'doc-1' }];
            mockListDocuments.mockResolvedValue({
                documents: mockDocs,
                total: 1,
            });
            mockDeleteDocument.mockResolvedValue(undefined);

            const result = await appwriteSystemSettings.resetSettings('general');

            expect(result).toEqual({ success: true });
            expect(mockListDocuments).toHaveBeenCalledWith(
                'test-database',
                'system-settings-collection',
                ['equal(category,general)']
            );
        });

        it('should succeed with no settings to delete', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteSystemSettings.resetSettings();

            expect(result).toEqual({ success: true });
            expect(mockDeleteDocument).not.toHaveBeenCalled();
        });

        it('should throw error on failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('Reset failed'));

            await expect(appwriteSystemSettings.resetSettings()).rejects.toThrow('Reset failed');
        });
    });
});

describe('appwriteThemePresets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should return all theme presets', async () => {
            const mockPresets = [
                { $id: '1', name: 'Light Theme' },
                { $id: '2', name: 'Dark Theme' },
            ];
            mockListDocuments.mockResolvedValue({
                documents: mockPresets,
                total: 2,
            });

            const result = await appwriteThemePresets.list();

            expect(result).toEqual(mockPresets);
        });

        it('should throw error on failure', async () => {
            mockListDocuments.mockRejectedValue(new Error('List failed'));

            await expect(appwriteThemePresets.list()).rejects.toThrow('List failed');
        });
    });

    describe('get', () => {
        it('should return theme preset by id', async () => {
            const mockPreset = { $id: 'preset-1', name: 'Light' };
            mockGetDocument_base.mockResolvedValue(mockPreset);

            const result = await appwriteThemePresets.get('preset-1');

            expect(result).toEqual(mockPreset);
            expect(mockGetDocument_base).toHaveBeenCalledWith('themePresets', 'preset-1');
        });
    });

    describe('getDefault', () => {
        it('should return default theme preset', async () => {
            const mockPreset = { $id: 'default', name: 'Default Theme', is_default: true };
            mockListDocuments.mockResolvedValue({
                documents: [mockPreset],
                total: 1,
            });

            const result = await appwriteThemePresets.getDefault();

            expect(result).toEqual(mockPreset);
        });

        it('should return null when no default exists', async () => {
            mockListDocuments.mockResolvedValue({
                documents: [],
                total: 0,
            });

            const result = await appwriteThemePresets.getDefault();

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockListDocuments.mockRejectedValue(new Error('Error'));

            const result = await appwriteThemePresets.getDefault();

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create theme preset', async () => {
            const mockCreated = { $id: 'new-preset', name: 'New Theme' };
            mockCreateDocument_base.mockResolvedValue(mockCreated);

            const result = await appwriteThemePresets.create({ name: 'New Theme' });

            expect(result).toEqual(mockCreated);
            expect(mockCreateDocument_base).toHaveBeenCalledWith(
                'themePresets',
                expect.objectContaining({
                    name: 'New Theme',
                    created_at: expect.any(String),
                })
            );
        });
    });

    describe('update', () => {
        it('should update theme preset', async () => {
            const mockUpdated = { $id: 'preset-1', name: 'Updated Theme' };
            mockUpdateDocument_base.mockResolvedValue(mockUpdated);

            const result = await appwriteThemePresets.update('preset-1', { name: 'Updated Theme' });

            expect(result).toEqual(mockUpdated);
            expect(mockUpdateDocument_base).toHaveBeenCalledWith(
                'themePresets',
                'preset-1',
                expect.objectContaining({
                    name: 'Updated Theme',
                    updatedAt: expect.any(String),
                })
            );
        });
    });

    describe('remove', () => {
        it('should remove theme preset', async () => {
            mockDeleteDocument_base.mockResolvedValue(undefined);

            await appwriteThemePresets.remove('preset-1');

            expect(mockDeleteDocument_base).toHaveBeenCalledWith('themePresets', 'preset-1');
        });
    });
});
