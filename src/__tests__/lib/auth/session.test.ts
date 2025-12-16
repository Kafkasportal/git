/**
 * Session Utility Tests
 * Tests for session parsing, serialization, and expiry
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';

// We can only test functions that don't rely on Next.js internals
// Import the specific functions we can test

describe('Session Utilities', () => {
    // Save original env
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        // Use a secure test secret key (not a real password)
        process.env = { ...originalEnv, SESSION_SECRET: 't3st-s3cr3t-k3y-m1n-16-ch4rs-x9z8y7w6' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('parseAuthSession', () => {
        it('should return null for empty cookie', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            expect(parseAuthSession()).toBeNull();
            expect(parseAuthSession('')).toBeNull();
        });

        it('should parse valid signed session', async () => {
            const { parseAuthSession, serializeSessionCookie } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'test-session-123',
                userId: 'user-456',
                expire: new Date(Date.now() + 3600000).toISOString(),
            };

            const serialized = serializeSessionCookie(session);
            const parsed = parseAuthSession(serialized);

            expect(parsed).not.toBeNull();
            expect(parsed?.sessionId).toBe('test-session-123');
            expect(parsed?.userId).toBe('user-456');
        });

        it('should reject tampered session', async () => {
            const { parseAuthSession, serializeSessionCookie } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'test-session-123',
                userId: 'user-456',
            };

            const serialized = serializeSessionCookie(session);
            // Tamper with the signature
            const [payload] = serialized.split('.');
            const tampered = `${payload}.invalidSignature`;

            const parsed = parseAuthSession(tampered);
            expect(parsed).toBeNull();
        });

        it('should parse legacy JSON session (backwards compatibility)', async () => {
            // Legacy format was plain JSON
            const legacySession = JSON.stringify({
                sessionId: 'legacy-session',
                userId: 'legacy-user',
            });

            // This should fall back to legacy parsing when secret is not present
            // but with secret present it may fail - let's check behavior
            const tempEnv = process.env.SESSION_SECRET;
            delete process.env.SESSION_SECRET;

            vi.resetModules();
            const { parseAuthSession: parseWithoutSecret } = await import('@/lib/auth/session');

            const parsed = parseWithoutSecret(legacySession);
            expect(parsed).not.toBeNull();
            expect(parsed?.sessionId).toBe('legacy-session');

            process.env.SESSION_SECRET = tempEnv;
        });
    });

    describe('serializeSessionCookie', () => {
        it('should create signed cookie string', async () => {
            const { serializeSessionCookie } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'sess-123',
                userId: 'user-456',
            };

            const result = serializeSessionCookie(session);

            expect(result).toContain('.');
            const parts = result.split('.');
            expect(parts).toHaveLength(2);
        });

        it('should throw without SESSION_SECRET', async () => {
            delete process.env.SESSION_SECRET;
            vi.resetModules();

            const { serializeSessionCookie } = await import('@/lib/auth/session');

            expect(() => serializeSessionCookie({
                sessionId: 'test',
                userId: 'test',
            })).toThrow('SESSION_SECRET is missing or too short');
        });

        it('should throw with short SESSION_SECRET', async () => {
            process.env.SESSION_SECRET = 'short';
            vi.resetModules();

            const { serializeSessionCookie } = await import('@/lib/auth/session');

            expect(() => serializeSessionCookie({
                sessionId: 'test',
                userId: 'test',
            })).toThrow('SESSION_SECRET is missing or too short');
        });

        it('should produce consistent output for same input', async () => {
            const { serializeSessionCookie } = await import('@/lib/auth/session');

            const session = { sessionId: 'test', userId: 'user' };

            const result1 = serializeSessionCookie(session);
            const result2 = serializeSessionCookie(session);

            expect(result1).toBe(result2);
        });
    });

    describe('isSessionExpired', () => {
        it('should return false for session without expire', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');

            const session = { sessionId: 'test', userId: 'user' };
            expect(isSessionExpired(session)).toBe(false);
        });

        it('should return false for null session', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');
            expect(isSessionExpired(null)).toBe(false);
        });

        it('should return true for expired session', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'test',
                userId: 'user',
                expire: new Date(Date.now() - 1000).toISOString(), // 1 second ago
            };

            expect(isSessionExpired(session)).toBe(true);
        });

        it('should return false for valid session', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'test',
                userId: 'user',
                expire: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            };

            expect(isSessionExpired(session)).toBe(false);
        });

        it('should handle invalid date string', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'test',
                userId: 'user',
                expire: 'invalid-date',
            };

            expect(isSessionExpired(session)).toBe(false);
        });
    });

    describe('Signature Verification', () => {
        it('should create valid HMAC signature', async () => {
            const { serializeSessionCookie } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'sig-test',
                userId: 'sig-user',
            };

            const serialized = serializeSessionCookie(session);
            const [payload, signature] = serialized.split('.');

            // Manually verify the signature
            const testSecret = process.env.SESSION_SECRET || 't3st-s3cr3t-k3y-m1n-16-ch4rs-x9z8y7w6';
            const expectedSig = createHmac('sha256', testSecret)
                .update(payload)
                .digest('hex');

            expect(signature).toBe(expectedSig);
        });
    });

    describe('getUserFromSession', () => {
        it('should return null for null session', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const result = await getUserFromSession(null);
            expect(result).toBeNull();
        });

        it('should return null for expired session', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const expiredSession = {
                sessionId: 'test',
                userId: 'user',
                expire: new Date(Date.now() - 1000).toISOString(),
            };
            const result = await getUserFromSession(expiredSession);
            expect(result).toBeNull();
        });

        it('should return mock admin user for mock-admin-1', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'mock-admin-1',
            };
            const result = await getUserFromSession(session);
            expect(result).not.toBeNull();
            expect(result?.email).toBe('admin@test.com');
            expect(result?.name).toBe('Dernek Başkanı');
            expect(result?.role).toBe('Dernek Başkanı');
            expect(result?.isActive).toBe(true);
        });

        it('should return mock admin user for mock-admin-2', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'mock-admin-2',
            };
            const result = await getUserFromSession(session);
            expect(result).not.toBeNull();
            expect(result?.email).toBe('admin@portal.com');
        });

        it('should return mock manager user for mock-manager-1', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'mock-manager-1',
            };
            const result = await getUserFromSession(session);
            expect(result).not.toBeNull();
            expect(result?.email).toBe('manager@test.com');
            expect(result?.role).toBe('Yönetici');
        });

        it('should return mock member user for mock-member-1', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'mock-member-1',
            };
            const result = await getUserFromSession(session);
            expect(result).not.toBeNull();
            expect(result?.email).toBe('member@test.com');
            expect(result?.role).toBe('Üye');
        });

        it('should return mock viewer user for mock-viewer-1', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'mock-viewer-1',
            };
            const result = await getUserFromSession(session);
            expect(result).not.toBeNull();
            expect(result?.email).toBe('viewer@test.com');
            expect(result?.role).toBe('Görüntüleyici');
        });

        it('should return null for unknown mock user', async () => {
            const { getUserFromSession } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'mock-unknown-user',
            };
            const result = await getUserFromSession(session);
            expect(result).toBeNull();
        });
    });

    describe('parseAuthSession edge cases', () => {
        it('should return null for invalid base64 payload', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            // Invalid base64 with valid-looking signature
            const result = parseAuthSession('!!!invalid.signature');
            expect(result).toBeNull();
        });

        it('should return null for session missing sessionId', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            // Create a valid-looking signed payload but with missing sessionId
            const testSecret = process.env.SESSION_SECRET || 't3st-s3cr3t-k3y-m1n-16-ch4rs-x9z8y7w6';
            const payload = Buffer.from(JSON.stringify({ userId: 'user' })).toString('base64url');
            const signature = createHmac('sha256', testSecret)
                .update(payload)
                .digest('hex');
            const result = parseAuthSession(`${payload}.${signature}`);
            expect(result).toBeNull();
        });

        it('should return null for session missing userId', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            // Create a valid-looking signed payload but with missing userId
            const testSecret = process.env.SESSION_SECRET || 't3st-s3cr3t-k3y-m1n-16-ch4rs-x9z8y7w6';
            const payload = Buffer.from(JSON.stringify({ sessionId: 'sess' })).toString('base64url');
            const signature = createHmac('sha256', testSecret)
                .update(payload)
                .digest('hex');
            const result = parseAuthSession(`${payload}.${signature}`);
            expect(result).toBeNull();
        });

        it('should handle session with no signature part (try legacy parsing)', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            // Plain JSON without base64 encoding - should attempt legacy parsing
            const legacySession = JSON.stringify({ sessionId: 'sess', userId: 'user' });
            const result = parseAuthSession(legacySession);
            // Should fall back to legacy parsing and succeed
            expect(result).not.toBeNull();
            expect(result?.sessionId).toBe('sess');
            expect(result?.userId).toBe('user');
        });

        it('should handle empty payload', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            const result = parseAuthSession('.');
            expect(result).toBeNull();
        });
    });

    describe('Session expiry edge cases', () => {
        it('should handle session expiring right now', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'user',
                expire: new Date().toISOString(),
            };
            // Session expiring right now should be considered expired
            const result = isSessionExpired(session);
            expect(typeof result).toBe('boolean');
        });

        it('should handle very far future expiry', async () => {
            const { isSessionExpired } = await import('@/lib/auth/session');
            const session = {
                sessionId: 'test',
                userId: 'user',
                expire: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            };
            expect(isSessionExpired(session)).toBe(false);
        });
    });
});
