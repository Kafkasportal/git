/**
 * Appwrite Configuration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Appwrite Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('appwriteConfig', () => {
        it('should export configuration object', async () => {
            const { appwriteConfig } = await import('@/lib/appwrite/config');
            
            expect(appwriteConfig).toBeDefined();
            expect(appwriteConfig.endpoint).toBeDefined();
            expect(appwriteConfig.collections).toBeDefined();
            expect(appwriteConfig.buckets).toBeDefined();
        });

        it('should have all required collections', async () => {
            const { appwriteConfig } = await import('@/lib/appwrite/config');
            
            expect(appwriteConfig.collections.users).toBe('users');
            expect(appwriteConfig.collections.beneficiaries).toBe('beneficiaries');
            expect(appwriteConfig.collections.donations).toBe('donations');
            expect(appwriteConfig.collections.meetings).toBe('meetings');
            expect(appwriteConfig.collections.tasks).toBe('tasks');
            expect(appwriteConfig.collections.todos).toBe('todos');
        });

        it('should have all required buckets', async () => {
            const { appwriteConfig } = await import('@/lib/appwrite/config');
            
            expect(appwriteConfig.buckets.documents).toBeDefined();
            expect(appwriteConfig.buckets.avatars).toBeDefined();
            expect(appwriteConfig.buckets.receipts).toBeDefined();
        });
    });

    describe('getCollectionId', () => {
        it('should return collection ID for valid name', async () => {
            const { getCollectionId } = await import('@/lib/appwrite/config');
            
            expect(getCollectionId('users')).toBe('users');
            expect(getCollectionId('beneficiaries')).toBe('beneficiaries');
            expect(getCollectionId('donations')).toBe('donations');
        });
    });

    describe('getBucketId', () => {
        it('should return bucket ID for valid name', async () => {
            const { getBucketId } = await import('@/lib/appwrite/config');
            
            expect(getBucketId('documents')).toBeDefined();
            expect(getBucketId('avatars')).toBeDefined();
            expect(getBucketId('receipts')).toBeDefined();
        });
    });

    describe('isClientConfigured', () => {
        it('should return true when client config is complete', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
            
            vi.resetModules();
            const { isClientConfigured } = await import('@/lib/appwrite/config');
            
            expect(isClientConfigured()).toBe(true);
        });

        it('should return false when project ID is missing', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
            
            vi.resetModules();
            const { isClientConfigured } = await import('@/lib/appwrite/config');
            
            expect(isClientConfigured()).toBe(false);
        });

        it('should return false when database ID is missing', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = '';
            
            vi.resetModules();
            const { isClientConfigured } = await import('@/lib/appwrite/config');
            
            expect(isClientConfigured()).toBe(false);
        });
    });

    describe('isServerConfigured', () => {
        it('should return true when server config is complete', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
            process.env.APPWRITE_API_KEY = 'test-api-key';
            
            vi.resetModules();
            const { isServerConfigured } = await import('@/lib/appwrite/config');
            
            expect(isServerConfigured()).toBe(true);
        });

        it('should return false when API key is missing', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
            process.env.APPWRITE_API_KEY = '';
            
            vi.resetModules();
            const { isServerConfigured } = await import('@/lib/appwrite/config');
            
            expect(isServerConfigured()).toBe(false);
        });
    });

    describe('isAppwriteConfigured', () => {
        it('should check server config by default', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
            process.env.APPWRITE_API_KEY = 'test-api-key';
            
            vi.resetModules();
            const { isAppwriteConfigured } = await import('@/lib/appwrite/config');
            
            expect(isAppwriteConfigured()).toBe(true);
            expect(isAppwriteConfigured(true)).toBe(true);
        });

        it('should check client config when requireApiKey is false', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
            process.env.APPWRITE_API_KEY = '';
            
            vi.resetModules();
            const { isAppwriteConfigured } = await import('@/lib/appwrite/config');
            
            expect(isAppwriteConfigured(false)).toBe(true);
            expect(isAppwriteConfigured(true)).toBe(false);
        });
    });

    describe('isBuildTime', () => {
        it('should export isBuildTime constant', async () => {
            const { isBuildTime } = await import('@/lib/appwrite/config');
            
            expect(typeof isBuildTime).toBe('boolean');
        });
    });
});
