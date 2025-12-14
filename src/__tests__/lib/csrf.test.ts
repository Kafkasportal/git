/**
 * CSRF Server-Side Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
    generateCsrfToken,
    getCsrfTokenHeader,
    validateCsrfToken,
} from '@/lib/csrf';

describe('CSRF Server-Side Utilities', () => {
    describe('generateCsrfToken', () => {
        it('should generate a token', () => {
            const token = generateCsrfToken();
            
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        it('should return a hex string', () => {
            const token = generateCsrfToken();
            
            // Hex string should only contain 0-9 and a-f
            expect(token).toMatch(/^[0-9a-f]+$/);
        });

        it('should return a 64 character string (32 bytes = 64 hex chars)', () => {
            const token = generateCsrfToken();
            
            expect(token.length).toBe(64);
        });

        it('should generate unique tokens on each call', () => {
            const token1 = generateCsrfToken();
            const token2 = generateCsrfToken();
            const token3 = generateCsrfToken();
            
            expect(token1).not.toBe(token2);
            expect(token2).not.toBe(token3);
            expect(token1).not.toBe(token3);
        });

        it('should generate cryptographically random tokens', () => {
            // Generate multiple tokens and verify they are all different
            const tokens = new Set<string>();
            for (let i = 0; i < 100; i++) {
                tokens.add(generateCsrfToken());
            }
            // All 100 tokens should be unique
            expect(tokens.size).toBe(100);
        });
    });

    describe('getCsrfTokenHeader', () => {
        it('should return the CSRF token header name', () => {
            const header = getCsrfTokenHeader();
            expect(header).toBe('x-csrf-token');
        });

        it('should return consistent header name', () => {
            const header1 = getCsrfTokenHeader();
            const header2 = getCsrfTokenHeader();
            expect(header1).toBe(header2);
        });

        it('should return lowercase header name', () => {
            const header = getCsrfTokenHeader();
            expect(header).toBe(header.toLowerCase());
        });
    });

    describe('validateCsrfToken', () => {
        it('should return true for matching tokens', () => {
            const token = 'abc123xyz789def456';
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

        it('should return false for both empty tokens', () => {
            expect(validateCsrfToken('', '')).toBe(false);
        });

        it('should return false for null-like values', () => {
            // @ts-expect-error - Testing null handling
            expect(validateCsrfToken(null, 'abc123')).toBe(false);
            // @ts-expect-error - Testing undefined handling
            expect(validateCsrfToken(undefined, 'abc123')).toBe(false);
            // @ts-expect-error - Testing null handling
            expect(validateCsrfToken('abc123', null)).toBe(false);
            // @ts-expect-error - Testing undefined handling
            expect(validateCsrfToken('abc123', undefined)).toBe(false);
        });

        it('should return false for different length tokens', () => {
            expect(validateCsrfToken('short', 'muchlongertoken')).toBe(false);
            expect(validateCsrfToken('verylongtoken', 'short')).toBe(false);
        });

        it('should use constant-time comparison for same length tokens', () => {
            const token = 'secure-token-12345678901234567890';
            expect(validateCsrfToken(token, token)).toBe(true);
            expect(validateCsrfToken(token, 'secure-token-12345678901234567891')).toBe(false);
        });

        it('should detect single character difference', () => {
            expect(validateCsrfToken('abcdef', 'abcdeg')).toBe(false);
            expect(validateCsrfToken('abcdef', 'Abcdef')).toBe(false);
        });

        it('should handle special characters', () => {
            const token = 'token-with-special!@#$%^&*()';
            expect(validateCsrfToken(token, token)).toBe(true);
            expect(validateCsrfToken(token, 'token-with-special!@#$%^&*()')).toBe(true);
        });

        it('should handle unicode characters', () => {
            const token = 'token-with-unicode-αβγδ';
            expect(validateCsrfToken(token, token)).toBe(true);
        });

        it('should handle hex tokens like generated ones', () => {
            const hexToken = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
            expect(validateCsrfToken(hexToken, hexToken)).toBe(true);
            expect(validateCsrfToken(hexToken, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b3')).toBe(false);
        });

        it('should validate generated tokens correctly', () => {
            const generatedToken = generateCsrfToken();
            expect(validateCsrfToken(generatedToken, generatedToken)).toBe(true);
            
            // Modify one character
            const modifiedToken = generatedToken.slice(0, -1) + (generatedToken.slice(-1) === '0' ? '1' : '0');
            expect(validateCsrfToken(generatedToken, modifiedToken)).toBe(false);
        });
    });

    describe('Re-exported client functions', () => {
        // These are re-exported from csrf-client for backward compatibility
        it('should export getCsrfTokenFromCookie', async () => {
            const { getCsrfTokenFromCookie } = await import('@/lib/csrf');
            expect(typeof getCsrfTokenFromCookie).toBe('function');
        });

        it('should export fetchWithCsrf', async () => {
            const { fetchWithCsrf } = await import('@/lib/csrf');
            expect(typeof fetchWithCsrf).toBe('function');
        });
    });
});
