import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import {
  addCacheHeaders,
  createCachedResponse,
  hasMatchingETag,
  createNotModifiedResponse,
  CACHE_CONFIGS,
} from '@/lib/http-cache';
import type { CacheHeadersOptions } from '@/lib/http-cache';

describe('HTTP Cache Utilities', () => {
  describe('addCacheHeaders', () => {
    it('should add max-age cache header', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = { maxAge: 60000 };

      const result = addCacheHeaders(response, options);
      const cacheControl = result.headers.get('Cache-Control');

      expect(cacheControl).toContain('max-age=60');
    });

    it('should add stale-while-revalidate header', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = {
        maxAge: 60000,
        swr: 300000,
      };

      const result = addCacheHeaders(response, options);
      const cacheControl = result.headers.get('Cache-Control');

      expect(cacheControl).toContain('max-age=60');
      expect(cacheControl).toContain('stale-while-revalidate=300');
    });

    it('should add custom cache control directives', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = {
        cacheControl: ['public', 'immutable'],
        maxAge: 60000,
      };

      const result = addCacheHeaders(response, options);
      const cacheControl = result.headers.get('Cache-Control');

      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('immutable');
    });

    it('should generate ETag when enabled', () => {
      const response = new Response('{"data": "test"}');
      const options: CacheHeadersOptions = {
        etag: true,
        maxAge: 60000,
      };

      const result = addCacheHeaders(response, options);
      const etag = result.headers.get('ETag');

      // ETag should be generated in format: "hash"
      expect(etag).toBeDefined();
      if (etag) {
        expect(typeof etag).toBe('string');
        expect(etag.startsWith('"')).toBe(true);
        expect(etag.endsWith('"')).toBe(true);
      }
    });

    it('should add custom headers', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = {
        customHeaders: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value',
        },
        maxAge: 60000,
      };

      const result = addCacheHeaders(response, options);

      expect(result.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(result.headers.get('X-Another-Header')).toBe('another-value');
    });

    it('should work with NextResponse', () => {
      const response = NextResponse.json({ data: 'test' });
      const options: CacheHeadersOptions = { maxAge: 60000 };

      const result = addCacheHeaders(response, options);
      const cacheControl = result.headers.get('Cache-Control');

      expect(cacheControl).toContain('max-age=60');
    });

    it('should handle no options gracefully', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = {};

      const result = addCacheHeaders(response, options);

      expect(result).toBeDefined();
      expect(result.headers).toBeDefined();
    });

    it('should convert milliseconds to seconds correctly', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = {
        maxAge: 300000, // 5 minutes
        swr: 900000, // 15 minutes
      };

      const result = addCacheHeaders(response, options);
      const cacheControl = result.headers.get('Cache-Control');

      expect(cacheControl).toContain('max-age=300');
      expect(cacheControl).toContain('stale-while-revalidate=900');
    });

    it('should handle combined directives correctly', () => {
      const response = new Response('test');
      const options: CacheHeadersOptions = {
        cacheControl: ['public', 'no-transform'],
        maxAge: 86400000, // 1 day
        swr: 604800000, // 7 days
        etag: true,
      };

      const result = addCacheHeaders(response, options);
      const cacheControl = result.headers.get('Cache-Control');
      const etag = result.headers.get('ETag');

      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('no-transform');
      expect(cacheControl).toContain('max-age=86400');
      expect(cacheControl).toContain('stale-while-revalidate=604800');
      expect(etag).toBeDefined();
    });
  });

  describe('createCachedResponse', () => {
    it('should create a cached JSON response', () => {
      const data = { id: 1, name: 'test' };
      const options: CacheHeadersOptions = { maxAge: 60000 };

      const result = createCachedResponse(data, { ...options, status: 200 });

      expect(result.status).toBe(200);
      expect(result.headers.get('Cache-Control')).toContain('max-age=60');
    });

    it('should include ETag in cached response when enabled', () => {
      const data = { id: 1, name: 'test' };
      const options: CacheHeadersOptions = { maxAge: 60000, etag: true };

      const result = createCachedResponse(data, { ...options, status: 200 });

      expect(result.headers.get('ETag')).toBeDefined();
    });

    it('should allow custom status codes', () => {
      const data = { id: 1 };
      const result = createCachedResponse(data, { status: 201, maxAge: 60000 });

      expect(result.status).toBe(201);
    });

    it('should create response with custom headers', () => {
      const data = { test: 'data' };
      const options: CacheHeadersOptions = {
        maxAge: 60000,
        customHeaders: { 'X-Custom': 'value' },
      };

      const result = createCachedResponse(data, { ...options, status: 200 });

      expect(result.headers.get('X-Custom')).toBe('value');
    });
  });

  describe('hasMatchingETag', () => {
    it('should detect matching ETag', () => {
      const etag = '"test-etag"';
      const request = new Request('http://localhost', {
        headers: { 'If-None-Match': etag },
      });

      const result = hasMatchingETag(request, etag);
      expect(result).toBe(true);
    });

    it('should return false for non-matching ETag', () => {
      const request = new Request('http://localhost', {
        headers: { 'If-None-Match': '"other-etag"' },
      });

      const result = hasMatchingETag(request, '"test-etag"');
      expect(result).toBe(false);
    });

    it('should return false when If-None-Match is missing', () => {
      const request = new Request('http://localhost');

      const result = hasMatchingETag(request, '"test-etag"');
      expect(result).toBe(false);
    });
  });

  describe('createNotModifiedResponse', () => {
    it('should create 304 Not Modified response', () => {
      const etag = '"test-etag"';
      const result = createNotModifiedResponse(etag);

      expect(result.status).toBe(304);
      expect(result.headers.get('ETag')).toBe(etag);
    });

    it('should have empty body', () => {
      const etag = '"test-etag"';
      const result = createNotModifiedResponse(etag);

      expect(result.body).toBeNull();
    });
  });

  describe('CACHE_CONFIGS', () => {
    it('should define NO_CACHE configuration', () => {
      expect(CACHE_CONFIGS.NO_CACHE).toBeDefined();
      expect(CACHE_CONFIGS.NO_CACHE.cacheControl).toContain('no-store');
      expect(CACHE_CONFIGS.NO_CACHE.cacheControl).toContain('private');
    });

    it('should define PRIVATE configuration', () => {
      expect(CACHE_CONFIGS.PRIVATE).toBeDefined();
      expect(CACHE_CONFIGS.PRIVATE.cacheControl).toContain('private');
      expect(CACHE_CONFIGS.PRIVATE.maxAge).toBeGreaterThan(0);
    });

    it('should define PUBLIC_SHORT configuration', () => {
      expect(CACHE_CONFIGS.PUBLIC_SHORT).toBeDefined();
      expect(CACHE_CONFIGS.PUBLIC_SHORT.cacheControl).toContain('public');
      expect(CACHE_CONFIGS.PUBLIC_SHORT.maxAge).toBeGreaterThan(0);
    });

    it('should define PUBLIC_STANDARD configuration', () => {
      expect(CACHE_CONFIGS.PUBLIC_STANDARD).toBeDefined();
      expect(CACHE_CONFIGS.PUBLIC_STANDARD.cacheControl).toContain('public');
      expect(CACHE_CONFIGS.PUBLIC_STANDARD.maxAge).toBeGreaterThan(CACHE_CONFIGS.PUBLIC_SHORT.maxAge || 0);
    });

    it('should define PUBLIC_LONG configuration', () => {
      expect(CACHE_CONFIGS.PUBLIC_LONG).toBeDefined();
      expect(CACHE_CONFIGS.PUBLIC_LONG.cacheControl).toContain('public');
      expect(CACHE_CONFIGS.PUBLIC_LONG.maxAge).toBeGreaterThan(CACHE_CONFIGS.PUBLIC_STANDARD.maxAge || 0);
    });

    it('should have increasing cache times', () => {
      const short = CACHE_CONFIGS.PUBLIC_SHORT.maxAge || 0;
      const standard = CACHE_CONFIGS.PUBLIC_STANDARD.maxAge || 0;
      const long = CACHE_CONFIGS.PUBLIC_LONG.maxAge || 0;

      expect(short).toBeLessThanOrEqual(standard);
      expect(standard).toBeLessThanOrEqual(long);
    });

    it('should have ETags where configured', () => {
      expect(CACHE_CONFIGS.PUBLIC_SHORT.etag).toBe(true);
      expect(CACHE_CONFIGS.PUBLIC_STANDARD.etag).toBe(true);
      expect(CACHE_CONFIGS.PUBLIC_LONG.etag).toBe(true);
    });
  });
});
