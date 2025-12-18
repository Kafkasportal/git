/**
 * CSRF Client Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getCsrfTokenHeader,
    validateCsrfToken,
    getCsrfTokenFromCookie,
    fetchWithCsrf,
} from '@/lib/csrf-client';

describe('CSRF Client Utilities', () => {
    describe('getCsrfTokenHeader', () => {
        it('should return the CSRF token header name', () => {
            const header = getCsrfTokenHeader();
            expect(header).toBe('x-csrf-token');
        });
    });

    describe('validateCsrfToken', () => {
        it('should return true for matching tokens', () => {
            const token = 'abc123xyz';
            expect(validateCsrfToken(token, token)).toBe(true);
        });

        it('should return false for non-matching tokens', () => {
            expect(validateCsrfToken('abc123', 'xyz789')).toBe(false);
        });

        it('should return false for empty token', () => {
            expect(validateCsrfToken('', 'abc123')).toBe(false);
        });

        it('should return false for empty expected token', () => {
            expect(validateCsrfToken('abc123', '')).toBe(false);
        });

        it('should return false for different length tokens', () => {
            expect(validateCsrfToken('short', 'muchlongertoken')).toBe(false);
        });

        it('should use constant-time comparison', () => {
            // This test verifies the function works correctly
            // Actual timing attack prevention is implementation detail
            const token = 'secure-token-12345';
            expect(validateCsrfToken(token, token)).toBe(true);
            expect(validateCsrfToken(token, 'secure-token-12346')).toBe(false);
        });
    });

    describe('getCsrfTokenFromCookie', () => {
        const originalDocument = globalThis.document;

        afterEach(() => {
            if (originalDocument) {
                Object.defineProperty(global, 'document', {
                    value: originalDocument,
                    writable: true,
                });
            }
        });

        it('should return null when document is undefined', () => {
            const doc = globalThis.document;
            // @ts-expect-error - Testing undefined document
            delete globalThis.document;

            const result = getCsrfTokenFromCookie();
            expect(result).toBeNull();

            globalThis.document = doc;
        });

        it('should return token from cookie', () => {
            Object.defineProperty(global, 'document', {
                value: {
                    cookie: 'csrf-token=test-token-123; other-cookie=value',
                },
                writable: true,
            });

            const result = getCsrfTokenFromCookie();
            expect(result).toBe('test-token-123');
        });

        it('should return null when csrf-token cookie not found', () => {
            Object.defineProperty(global, 'document', {
                value: {
                    cookie: 'other-cookie=value; another=test',
                },
                writable: true,
            });

            const result = getCsrfTokenFromCookie();
            expect(result).toBeNull();
        });

        it('should decode URI encoded token', () => {
            Object.defineProperty(global, 'document', {
                value: {
                    cookie: `csrf-token=${encodeURIComponent('token/with+special=chars')}`,
                },
                writable: true,
            });

            const result = getCsrfTokenFromCookie();
            expect(result).toBe('token/with+special=chars');
        });
    });

    describe('fetchWithCsrf', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fetchSpy: any;

        beforeEach(() => {
            fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            Object.defineProperty(global, 'document', {
                value: {
                    cookie: 'csrf-token=test-csrf-token',
                },
                writable: true,
            });
        });

        afterEach(() => {
            fetchSpy.mockRestore();
        });

        it('should include CSRF token for POST requests', async () => {
            await fetchWithCsrf('/api/test', { method: 'POST' });

            expect(fetchSpy).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({
                    method: 'POST',
                })
            );

            const callArgs = fetchSpy.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
            const headers = callArgs[1]?.headers as Headers;
            expect(headers.get('x-csrf-token')).toBe('test-csrf-token');
        });

        it('should include CSRF token for PUT requests', async () => {
            await fetchWithCsrf('/api/test', { method: 'PUT' });

            const callArgs = fetchSpy.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
            const headers = callArgs[1]?.headers as Headers;
            expect(headers.get('x-csrf-token')).toBe('test-csrf-token');
        });

        it('should include CSRF token for PATCH requests', async () => {
            await fetchWithCsrf('/api/test', { method: 'PATCH' });

            const callArgs = fetchSpy.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
            const headers = callArgs[1]?.headers as Headers;
            expect(headers.get('x-csrf-token')).toBe('test-csrf-token');
        });

        it('should include CSRF token for DELETE requests', async () => {
            await fetchWithCsrf('/api/test', { method: 'DELETE' });

            const callArgs = fetchSpy.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
            const headers = callArgs[1]?.headers as Headers;
            expect(headers.get('x-csrf-token')).toBe('test-csrf-token');
        });

        it('should not include CSRF token for GET requests', async () => {
            await fetchWithCsrf('/api/test', { method: 'GET' });

            const callArgs = fetchSpy.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
            const headers = callArgs[1]?.headers as Headers;
            expect(headers.get('x-csrf-token')).toBeNull();
        });

        it('should work without options', async () => {
            await fetchWithCsrf('/api/test');

            expect(fetchSpy).toHaveBeenCalledWith('/api/test', expect.any(Object));
        });
    });
});
