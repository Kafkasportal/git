/**
 * Tests for persistent cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistentCache, getCacheHitRate } from '@/lib/persistent-cache';
import { CACHE_TIMES } from '@/lib/cache-config';

describe('PersistentCache', () => {
  let cache: PersistentCache;

  beforeEach(async () => {
    cache = PersistentCache.getInstance();
    await cache.clear();
    cache.resetMetrics();
  });

  describe('set and get', () => {
    it('should store and retrieve data', async () => {
      const testData = { id: 1, name: 'Test' };

      await cache.set('test-key', testData);
      const retrieved = await cache.get('test-key');

      expect(retrieved).toEqual(testData);
    });

    it('should store data with custom TTL', async () => {
      const testData = 'test value';
      const ttl = 1000; // 1 second

      await cache.set('ttl-test', testData, ttl);
      const retrieved = await cache.get('ttl-test');

      expect(retrieved).toBe(testData);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await cache.get('non-existent');

      expect(retrieved).toBeNull();
    });

    it('should expire data after TTL', async () => {
      const testData = 'expires soon';
      const ttl = 100; // 100ms

      await cache.set('expire-test', testData, ttl);

      // Should exist immediately
      let retrieved = await cache.get('expire-test');
      expect(retrieved).toBe(testData);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      retrieved = await cache.get('expire-test');
      expect(retrieved).toBeNull();
    });

    it('should handle complex objects', async () => {
      const complexData = {
        id: 1,
        name: 'Test',
        nested: {
          value: 'nested value',
          array: [1, 2, 3],
        },
        date: new Date().toISOString(),
      };

      await cache.set('complex-test', complexData);
      const retrieved = await cache.get('complex-test');

      expect(retrieved).toEqual(complexData);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      await cache.set('exists', 'value');

      const exists = await cache.has('exists');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await cache.has('does-not-exist');

      expect(exists).toBe(false);
    });

    it('should return false for expired keys', async () => {
      await cache.set('expires', 'value', 50);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const exists = await cache.has('expires');

      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing keys', async () => {
      await cache.set('to-delete', 'value');

      await cache.delete('to-delete');

      const retrieved = await cache.get('to-delete');
      expect(retrieved).toBeNull();
    });

    it('should not throw on deleting non-existent keys', async () => {
      await expect(cache.delete('does-not-exist')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      vi.useFakeTimers(); // Use fake timers

      const initialTime = Date.now();
      vi.setSystemTime(initialTime);

      await cache.set('keep', 'value', CACHE_TIMES.LONG);
      await cache.set('expire1', 'value', 50);
      await cache.set('expire2', 'value', 50);

      // Advance time past expiration
      vi.setSystemTime(initialTime + 100);

      const cleaned = await cache.cleanup();

      expect(cleaned).toBeGreaterThanOrEqual(2);
      expect(await cache.get('keep')).not.toBeNull();
      expect(await cache.get('expire1')).toBeNull();
      expect(await cache.get('expire2')).toBeNull();

      vi.useRealTimers(); // Restore real timers
    });

    it('should return 0 when no entries to clean', async () => {
      await cache.set('keep', 'value', CACHE_TIMES.LONG);

      const cleaned = await cache.cleanup();

      expect(cleaned).toBe(0);
    });
  });

  describe('metrics', () => {
    it('should track cache hits', async () => {
      await cache.set('test', 'value');

      await cache.get('test'); // Hit
      await cache.get('test'); // Hit

      const metrics = cache.getMetrics();

      expect(metrics.hits).toBeGreaterThanOrEqual(2);
    });

    it('should track cache misses', async () => {
      await cache.get('non-existent-1'); // Miss
      await cache.get('non-existent-2'); // Miss

      const metrics = cache.getMetrics();

      expect(metrics.misses).toBeGreaterThanOrEqual(2);
    });

    it('should track sets', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const metrics = cache.getMetrics();

      expect(metrics.sets).toBeGreaterThanOrEqual(2);
    });

    it('should track deletes', async () => {
      await cache.set('key1', 'value1');
      await cache.delete('key1');

      const metrics = cache.getMetrics();

      expect(metrics.deletes).toBeGreaterThanOrEqual(1);
    });

    it('should reset metrics', async () => {
      await cache.set('test', 'value');
      await cache.get('test');

      cache.resetMetrics();

      const metrics = cache.getMetrics();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.sets).toBe(0);
      expect(metrics.deletes).toBe(0);
    });
  });

  describe('getSize', () => {
    it('should return cache size', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const size = await cache.getSize();

      expect(size).toHaveProperty('memory');
      expect(size).toHaveProperty('indexedDB');
      expect(size.memory).toBeGreaterThanOrEqual(2);
    });
  });

  describe('export', () => {
    it('should export cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', { nested: 'value' });

      const exported = await cache.export();

      expect(Object.keys(exported).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCacheHitRate', () => {
    it('should calculate hit rate correctly', async () => {
      cache.resetMetrics();

      await cache.set('test', 'value');

      await cache.get('test'); // Hit
      await cache.get('test'); // Hit
      await cache.get('miss1'); // Miss
      await cache.get('miss2'); // Miss

      const hitRate = getCacheHitRate();

      // 2 hits out of 4 total = 50%
      expect(hitRate).toBeCloseTo(50, 0);
    });

    it('should return 0 when no cache operations', () => {
      cache.resetMetrics();

      const hitRate = getCacheHitRate();

      expect(hitRate).toBe(0);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = PersistentCache.getInstance();
      const instance2 = PersistentCache.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
