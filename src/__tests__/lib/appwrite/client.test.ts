/**
 * Appwrite Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('@/lib/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock appwrite module
vi.mock('appwrite', () => ({
    Client: vi.fn().mockImplementation(() => ({
        setEndpoint: vi.fn().mockReturnThis(),
        setProject: vi.fn().mockReturnThis(),
        ping: vi.fn().mockResolvedValue(true),
    })),
    Account: vi.fn().mockImplementation(() => ({})),
    Databases: vi.fn().mockImplementation(() => ({})),
    Storage: vi.fn().mockImplementation(() => ({})),
    Avatars: vi.fn().mockImplementation(() => ({})),
    Functions: vi.fn().mockImplementation(() => ({})),
}));

describe('Appwrite Client', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('exports', () => {
        it('should export isAppwriteReady function', async () => {
            const { isAppwriteReady } = await import('@/lib/appwrite/client');
            expect(typeof isAppwriteReady).toBe('function');
        });

        it('should export getAccount function', async () => {
            const { getAccount } = await import('@/lib/appwrite/client');
            expect(typeof getAccount).toBe('function');
        });

        it('should export getDatabases function', async () => {
            const { getDatabases } = await import('@/lib/appwrite/client');
            expect(typeof getDatabases).toBe('function');
        });

        it('should export getStorage function', async () => {
            const { getStorage } = await import('@/lib/appwrite/client');
            expect(typeof getStorage).toBe('function');
        });

        it('should export getAvatars function', async () => {
            const { getAvatars } = await import('@/lib/appwrite/client');
            expect(typeof getAvatars).toBe('function');
        });

        it('should export getFunctions function', async () => {
            const { getFunctions } = await import('@/lib/appwrite/client');
            expect(typeof getFunctions).toBe('function');
        });

        it('should export pingAppwrite function', async () => {
            const { pingAppwrite } = await import('@/lib/appwrite/client');
            expect(typeof pingAppwrite).toBe('function');
        });

        it('should export client', async () => {
            const module = await import('@/lib/appwrite/client');
            expect('client' in module).toBe(true);
        });

        it('should export account', async () => {
            const module = await import('@/lib/appwrite/client');
            expect('account' in module).toBe(true);
        });

        it('should export databases', async () => {
            const module = await import('@/lib/appwrite/client');
            expect('databases' in module).toBe(true);
        });

        it('should export storage', async () => {
            const module = await import('@/lib/appwrite/client');
            expect('storage' in module).toBe(true);
        });

        it('should export avatars', async () => {
            const module = await import('@/lib/appwrite/client');
            expect('avatars' in module).toBe(true);
        });

        it('should export functions', async () => {
            const module = await import('@/lib/appwrite/client');
            expect('functions' in module).toBe(true);
        });
    });

    describe('isAppwriteReady', () => {
        it('should return boolean', async () => {
            const { isAppwriteReady } = await import('@/lib/appwrite/client');
            expect(typeof isAppwriteReady()).toBe('boolean');
        });
    });

    describe('lazy getters when client is null', () => {
        it('getAccount should return null when client is null', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = '';

            const { getAccount, client } = await import('@/lib/appwrite/client');
            
            // If client is null, getAccount should return null
            if (client === null) {
                expect(getAccount()).toBeNull();
            }
        });

        it('getDatabases should return null when client is null', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';

            const { getDatabases, client } = await import('@/lib/appwrite/client');
            
            if (client === null) {
                expect(getDatabases()).toBeNull();
            }
        });

        it('getStorage should return null when client is null', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';

            const { getStorage, client } = await import('@/lib/appwrite/client');
            
            if (client === null) {
                expect(getStorage()).toBeNull();
            }
        });

        it('getAvatars should return null when client is null', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';

            const { getAvatars, client } = await import('@/lib/appwrite/client');
            
            if (client === null) {
                expect(getAvatars()).toBeNull();
            }
        });

        it('getFunctions should return null when client is null', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';

            const { getFunctions, client } = await import('@/lib/appwrite/client');
            
            if (client === null) {
                expect(getFunctions()).toBeNull();
            }
        });
    });

    describe('pingAppwrite', () => {
        it('should return boolean', async () => {
            const { pingAppwrite } = await import('@/lib/appwrite/client');
            const result = await pingAppwrite();
            expect(typeof result).toBe('boolean');
        });
    });
});
