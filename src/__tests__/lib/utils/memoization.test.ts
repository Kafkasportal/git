/**
 * Memoization Utility Tests
 * Tests for Property 7: Memoization Idempotence
 */

import { describe, it, expect, vi } from 'vitest';
import { memoize, memoizeWeak, memoizeAsync, memoizeWithKey, clearAllMemoCaches } from '@/lib/utils/memoization';

describe('Memoization Utilities', () => {
  describe('memoize', () => {
    it('returns cached result for same arguments', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);
      
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      
      // Function should only be called once
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('calls function for different arguments', () => {
      const fn = vi.fn((a: number) => a * 2);
      const memoized = memoize(fn);
      
      expect(memoized(1)).toBe(2);
      expect(memoized(2)).toBe(4);
      expect(memoized(3)).toBe(6);
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('respects maxSize limit', () => {
      const fn = vi.fn((a: number) => a);
      const memoized = memoize(fn, 2);
      
      memoized(1);
      memoized(2);
      memoized(3); // This should evict 1
      
      // Calling 1 again should trigger a new call
      memoized(1);
      
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('uses custom key function', () => {
      const fn = vi.fn((obj: { id: number }) => obj.id * 2);
      const memoized = memoize(fn, 100, (obj) => String(obj.id));
      
      expect(memoized({ id: 1 })).toBe(2);
      expect(memoized({ id: 1 })).toBe(2); // Same id, should be cached
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('handles complex arguments', () => {
      const fn = vi.fn((arr: number[]) => arr.reduce((a, b) => a + b, 0));
      const memoized = memoize(fn);
      
      expect(memoized([1, 2, 3])).toBe(6);
      expect(memoized([1, 2, 3])).toBe(6);
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });


  describe('memoizeWeak', () => {
    it('caches results for object arguments', () => {
      const fn = vi.fn((obj: object) => (obj as { value: number }).value * 2);
      const memoized = memoizeWeak(fn);
      
      const obj = { value: 5 };
      
      expect(memoized(obj)).toBe(10);
      expect(memoized(obj)).toBe(10);
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('calls function for different objects', () => {
      const fn = vi.fn((obj: object) => (obj as { value: number }).value);
      const memoized = memoizeWeak(fn);
      
      expect(memoized({ value: 1 })).toBe(1);
      expect(memoized({ value: 2 })).toBe(2);
      
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoizeAsync', () => {
    it('caches async results', async () => {
      const fn = vi.fn(async (a: number) => a * 2);
      const memoized = memoizeAsync(fn);
      
      expect(await memoized(5)).toBe(10);
      expect(await memoized(5)).toBe(10);
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('removes from cache on error', async () => {
      let shouldFail = true;
      const fn = vi.fn(async (a: number) => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('Test error');
        }
        return a * 2;
      });
      const memoized = memoizeAsync(fn);
      
      // First call fails
      await expect(memoized(5)).rejects.toThrow('Test error');
      
      // Second call should retry (not cached)
      expect(await memoized(5)).toBe(10);
      
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('handles concurrent calls', async () => {
      const fn = vi.fn(async (a: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return a * 2;
      });
      const memoized = memoizeAsync(fn);
      
      // Start multiple concurrent calls
      const results = await Promise.all([
        memoized(5),
        memoized(5),
        memoized(5),
      ]);
      
      expect(results).toEqual([10, 10, 10]);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('memoizeWithKey', () => {
    it('uses custom key function', () => {
      const fn = vi.fn((user: { id: number; name: string }) => user.name.toUpperCase());
      const memoized = memoizeWithKey(fn, (user) => `user-${user.id}`);
      
      expect(memoized({ id: 1, name: 'alice' })).toBe('ALICE');
      expect(memoized({ id: 1, name: 'bob' })).toBe('ALICE'); // Same id, cached
      expect(memoized({ id: 2, name: 'charlie' })).toBe('CHARLIE');
      
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Property 7: Memoization Idempotence', () => {
    it('returns same result for identical inputs', () => {
      const fn = (x: number) => x * Math.random(); // Non-deterministic
      const memoized = memoize(fn);
      
      const result1 = memoized(42);
      const result2 = memoized(42);
      const result3 = memoized(42);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('memoized function is idempotent', () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x + callCount; // Would return different values without memoization
      };
      const memoized = memoize(fn);
      
      const results = Array.from({ length: 10 }, () => memoized(5));
      
      // All results should be the same
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('LRU Cache edge cases', () => {
    it('updates existing key and moves to end', () => {
      const fn = vi.fn((a: number) => a * 2);
      const memoized = memoize(fn, 3);
      
      // Fill cache
      memoized(1); // cache: [1]
      memoized(2); // cache: [1, 2]
      memoized(3); // cache: [1, 2, 3]
      
      // Access 1 again - should move to end
      memoized(1); // cache: [2, 3, 1]
      
      // Add new item - should evict 2 (LRU)
      memoized(4); // cache: [3, 1, 4]
      
      // 2 should be evicted, calling it again should trigger new call
      memoized(2);
      
      // 1 was accessed recently, should still be cached
      const callsBefore = fn.mock.calls.length;
      memoized(1);
      expect(fn.mock.calls.length).toBe(callsBefore); // No new call
    });

    it('handles cache miss correctly', () => {
      const fn = vi.fn((a: number) => a);
      const memoized = memoize(fn, 2);
      
      // First call - cache miss
      expect(memoized(1)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Second call with same arg - cache hit
      expect(memoized(1)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('evicts LRU item when cache is full', () => {
      const fn = vi.fn((a: number) => a * 10);
      const memoized = memoize(fn, 2);
      
      memoized(1); // cache: [1]
      memoized(2); // cache: [1, 2]
      memoized(3); // cache: [2, 3] - 1 evicted
      
      // 1 should be evicted
      const callsBefore = fn.mock.calls.length;
      memoized(1);
      expect(fn.mock.calls.length).toBe(callsBefore + 1);
    });
  });

  describe('clearAllMemoCaches', () => {
    it('is a function that can be called', () => {
      expect(typeof clearAllMemoCaches).toBe('function');
      // Should not throw
      expect(() => clearAllMemoCaches()).not.toThrow();
    });
  });

  describe('memoizeAsync with custom key', () => {
    it('uses custom key function for async memoization', async () => {
      const fn = vi.fn(async (obj: { id: number }) => obj.id * 3);
      const memoized = memoizeAsync(fn, 50, (obj) => `id-${obj.id}`);
      
      expect(await memoized({ id: 1 })).toBe(3);
      expect(await memoized({ id: 1 })).toBe(3);
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('respects maxSize for async memoization', async () => {
      const fn = vi.fn(async (a: number) => a);
      const memoized = memoizeAsync(fn, 2);
      
      await memoized(1);
      await memoized(2);
      await memoized(3); // Evicts 1
      
      // 1 should be evicted
      await memoized(1);
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });
});
