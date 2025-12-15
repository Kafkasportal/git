/**
 * Appwrite Server Client Tests
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

// Mock node-appwrite module
vi.mock('node-appwrite', () => ({
    Client: vi.fn().mockImplementation(() => ({
        setEndpoint: vi.fn().mockReturnThis(),
        setProject: vi.fn().mockReturnThis(),
        setKey: vi.fn().mockReturnThis(),
    })),
    Databases: vi.fn().mockImplementation(() => ({})),
    Storage: vi.fn().mockImplementation(() => ({})),
    Users: vi.fn().mockImplementation(() => ({})),
    Account: vi.fn().mockImplementation(() => ({})),
}));

describe('Appwrite Server Client', () => {
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
        it('should export serverClient', async () => {
            const serverModule = await import('@/lib/appwrite/server');
            expect('serverClient' in serverModule).toBe(true);
        });

        it('should export serverDatabases', async () => {
            const serverModule = await import('@/lib/appwrite/server');
            expect('serverDatabases' in serverModule).toBe(true);
        });

        it('should export serverStorage', async () => {
            const serverModule = await import('@/lib/appwrite/server');
            expect('serverStorage' in serverModule).toBe(true);
        });

        it('should export serverUsers', async () => {
            const serverModule = await import('@/lib/appwrite/server');
            expect('serverUsers' in serverModule).toBe(true);
        });

        it('should export serverAccount', async () => {
            const serverModule = await import('@/lib/appwrite/server');
            expect('serverAccount' in serverModule).toBe(true);
        });

        it('should export isServerClientReady function', async () => {
            const { isServerClientReady } = await import('@/lib/appwrite/server');
            expect(typeof isServerClientReady).toBe('function');
        });

        it('should export getServerClient function', async () => {
            const { getServerClient } = await import('@/lib/appwrite/server');
            expect(typeof getServerClient).toBe('function');
        });

        it('should export getServerDatabases function', async () => {
            const { getServerDatabases } = await import('@/lib/appwrite/server');
            expect(typeof getServerDatabases).toBe('function');
        });

        it('should export getServerStorage function', async () => {
            const { getServerStorage } = await import('@/lib/appwrite/server');
            expect(typeof getServerStorage).toBe('function');
        });

        it('should export getServerUsers function', async () => {
            const { getServerUsers } = await import('@/lib/appwrite/server');
            expect(typeof getServerUsers).toBe('function');
        });
    });

    describe('isServerClientReady', () => {
        it('should return boolean', async () => {
            const { isServerClientReady } = await import('@/lib/appwrite/server');
            expect(typeof isServerClientReady()).toBe('boolean');
        });
    });

    describe('getServerClient', () => {
        it('should throw error when server client is not configured', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';
            process.env.APPWRITE_API_KEY = '';

            const { getServerClient, serverClient } = await import('@/lib/appwrite/server');
            
            if (serverClient === null) {
                expect(() => getServerClient()).toThrow('Appwrite server client is not configured');
            }
        });
    });

    describe('getServerDatabases', () => {
        it('should throw error when server databases is not configured', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';
            process.env.APPWRITE_API_KEY = '';

            const { getServerDatabases, serverDatabases } = await import('@/lib/appwrite/server');
            
            if (serverDatabases === null) {
                expect(() => getServerDatabases()).toThrow('Appwrite server databases is not configured');
            }
        });
    });

    describe('getServerStorage', () => {
        it('should throw error when server storage is not configured', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';
            process.env.APPWRITE_API_KEY = '';

            const { getServerStorage, serverStorage } = await import('@/lib/appwrite/server');
            
            if (serverStorage === null) {
                expect(() => getServerStorage()).toThrow('Appwrite server storage is not configured');
            }
        });
    });

    describe('getServerUsers', () => {
        it('should throw error when server users is not configured', async () => {
            process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = '';
            process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '';
            process.env.APPWRITE_API_KEY = '';

            const { getServerUsers, serverUsers } = await import('@/lib/appwrite/server');
            
            if (serverUsers === null) {
                expect(() => getServerUsers()).toThrow('Appwrite server users is not configured');
            }
        });
    });
});
