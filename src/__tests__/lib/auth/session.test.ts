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
        process.env = { ...originalEnv, SESSION_SECRET: 'test-secret-key-min-16-chars' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('parseAuthSession', () => {
        it('should return null for empty cookie', async () => {
            const { parseAuthSession } = await import('@/lib/auth/session');
            expect(parseAuthSession(undefined)).toBeNull();
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
            const { parseAuthSession } = await import('@/lib/auth/session');

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
            const { serializeSessionCookie, parseAuthSession } = await import('@/lib/auth/session');

            const session = {
                sessionId: 'sig-test',
                userId: 'sig-user',
            };

            const serialized = serializeSessionCookie(session);
            const [payload, signature] = serialized.split('.');

            // Manually verify the signature
            const expectedSig = createHmac('sha256', 'test-secret-key-min-16-chars')
                .update(payload)
                .digest('hex');

            expect(signature).toBe(expectedSig);
        });
    });
});
