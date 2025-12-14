/**
 * HTTP Cache Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import {
    addCacheHeaders,
    createCachedResponse,
    hasMatchingETag,
    createNotModifiedResponse,
    getCacheConfigForRoute,
    CACHE_CONFIGS,
} from '@/lib/http-cache';

describe('HTTP Cache Utilities', () => {
    describe('addCacheHeaders', () => {
        it('should add max-age header', () => {
            const response = NextResponse.json({ data: 'test' });
            const result = addCacheHeaders(response, { maxAge: 60000 });

            expect(result.headers.get('Cache-Control')).toContain('max-age=60');
        });

        it('should add stale-while-revalidate header', () => {
            const response = NextResponse.json({ data: 'test' });
            const result = addCacheHeaders(response, { swr: 120000 });

            expect(result.headers.get('Cache-Control')).toContain('stale-while-revalidate=120');
        });

        it('should add cache control directives', () => {
            const response = NextResponse.json({ data: 'test' });
            const result = addCacheHeaders(response, {
                cacheControl: ['public'],
                maxAge: 60000,
            });

            const cacheControl = result.headers.get('Cache-Control');
            expect(cacheControl).toContain('public');
            expect(cacheControl).toContain('max-age=60');
        });

        it('should add custom headers', () => {
            const response = NextResponse.json({ data: 'test' });
            const result = addCacheHeaders(response, {
                customHeaders: { 'X-Custom-Header': 'custom-value' },
            });

            expect(result.headers.get('X-Custom-Header')).toBe('custom-value');
        });

        it('should handle empty options', () => {
            const response = NextResponse.json({ data: 'test' });
            const result = addCacheHeaders(response, {});

            expect(result).toBeDefined();
        });
    });

    describe('createCachedResponse', () => {
        it('should create response with default status', () => {
            const response = createCachedResponse({ data: 'test' });

            expect(response.status).toBe(200);
        });

        it('should create response with custom status', () => {
            const response = createCachedResponse({ data: 'test' }, { status: 201 });

            expect(response.status).toBe(201);
        });

        it('should add ETag when requested', () => {
            const response = createCachedResponse({ data: 'test' }, { etag: true });

            expect(response.headers.get('ETag')).toBeDefined();
            expect(response.headers.get('ETag')).toMatch(/^"[a-z0-9]+"$/);
        });

        it('should generate consistent ETags for same data', () => {
            const data = { id: 1, name: 'test' };
            const response1 = createCachedResponse(data, { etag: true });
            const response2 = createCachedResponse(data, { etag: true });

            expect(response1.headers.get('ETag')).toBe(response2.headers.get('ETag'));
        });

        it('should generate different ETags for different data', () => {
            const response1 = createCachedResponse({ id: 1 }, { etag: true });
            const response2 = createCachedResponse({ id: 2 }, { etag: true });

            expect(response1.headers.get('ETag')).not.toBe(response2.headers.get('ETag'));
        });
    });

    describe('hasMatchingETag', () => {
        it('should return true for matching ETag', () => {
            const request = new Request('http://localhost/api/test', {
                headers: { 'If-None-Match': '"abc123"' },
            });

            expect(hasMatchingETag(request, '"abc123"')).toBe(true);
        });

        it('should return false for non-matching ETag', () => {
            const request = new Request('http://localhost/api/test', {
                headers: { 'If-None-Match': '"abc123"' },
            });

            expect(hasMatchingETag(request, '"xyz789"')).toBe(false);
        });

        it('should return false when no If-None-Match header', () => {
            const request = new Request('http://localhost/api/test');

            expect(hasMatchingETag(request, '"abc123"')).toBe(false);
        });
    });

    describe('createNotModifiedResponse', () => {
        it('should create 304 response', () => {
            const response = createNotModifiedResponse('"abc123"');

            expect(response.status).toBe(304);
        });

        it('should include ETag header', () => {
            const response = createNotModifiedResponse('"abc123"');

            expect(response.headers.get('ETag')).toBe('"abc123"');
        });
    });

    describe('CACHE_CONFIGS', () => {
        it('should have NO_CACHE config', () => {
            expect(CACHE_CONFIGS.NO_CACHE).toBeDefined();
            expect(CACHE_CONFIGS.NO_CACHE.cacheControl).toContain('no-store');
        });

        it('should have PRIVATE config', () => {
            expect(CACHE_CONFIGS.PRIVATE).toBeDefined();
            expect(CACHE_CONFIGS.PRIVATE.cacheControl).toContain('private');
        });

        it('should have PUBLIC_SHORT config', () => {
            expect(CACHE_CONFIGS.PUBLIC_SHORT).toBeDefined();
            expect(CACHE_CONFIGS.PUBLIC_SHORT.cacheControl).toContain('public');
            expect(CACHE_CONFIGS.PUBLIC_SHORT.etag).toBe(true);
        });

        it('should have PUBLIC_STANDARD config', () => {
            expect(CACHE_CONFIGS.PUBLIC_STANDARD).toBeDefined();
        });

        it('should have PUBLIC_LONG config', () => {
            expect(CACHE_CONFIGS.PUBLIC_LONG).toBeDefined();
        });

        it('should have IMMUTABLE config', () => {
            expect(CACHE_CONFIGS.IMMUTABLE).toBeDefined();
            expect(CACHE_CONFIGS.IMMUTABLE.cacheControl).toContain('immutable');
        });

        it('should have REVALIDATE config', () => {
            expect(CACHE_CONFIGS.REVALIDATE).toBeDefined();
            expect(CACHE_CONFIGS.REVALIDATE.cacheControl).toContain('no-cache');
        });
    });

    describe('getCacheConfigForRoute', () => {
        it('should return NO_CACHE for auth endpoints', () => {
            const config = getCacheConfigForRoute('/api/auth/login');
            expect(config.cacheControl).toContain('no-store');
        });

        it('should return NO_CACHE for CSRF endpoints', () => {
            const config = getCacheConfigForRoute('/api/csrf');
            expect(config.cacheControl).toContain('no-store');
        });

        it('should return PUBLIC_SHORT for health endpoints', () => {
            const config = getCacheConfigForRoute('/api/health');
            expect(config.cacheControl).toContain('public');
        });

        it('should return PUBLIC_LONG for parameters endpoints', () => {
            const config = getCacheConfigForRoute('/api/parameters');
            expect(config.cacheControl).toContain('public');
        });

        it('should return PUBLIC_STANDARD for statistics endpoints', () => {
            const config = getCacheConfigForRoute('/api/statistics');
            expect(config.cacheControl).toContain('public');
        });

        it('should return PUBLIC_LONG for reports endpoints', () => {
            const config = getCacheConfigForRoute('/api/reports');
            expect(config.cacheControl).toContain('public');
        });

        it('should return PUBLIC_SHORT for beneficiaries endpoints', () => {
            const config = getCacheConfigForRoute('/api/beneficiaries');
            expect(config.cacheControl).toContain('public');
        });

        it('should return PUBLIC_SHORT for donations endpoints', () => {
            const config = getCacheConfigForRoute('/api/donations');
            expect(config.cacheControl).toContain('public');
        });

        it('should return REVALIDATE for tasks endpoints', () => {
            const config = getCacheConfigForRoute('/api/tasks');
            expect(config.cacheControl).toContain('no-cache');
        });

        it('should return REVALIDATE for messages endpoints', () => {
            const config = getCacheConfigForRoute('/api/messages');
            expect(config.cacheControl).toContain('no-cache');
        });

        it('should return PRIVATE for unknown endpoints', () => {
            const config = getCacheConfigForRoute('/api/unknown');
            expect(config.cacheControl).toContain('private');
        });
    });
});
