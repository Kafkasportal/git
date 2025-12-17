import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  CACHE_TIMES,
  GC_TIMES,
  CACHE_STRATEGIES,
  CACHE_KEYS,
  invalidateRelatedCaches,
  prefetchData,
  createOptimizedQueryClient,
  cacheUtils,
  getCacheStrategy,
} from '@/lib/cache-config';

describe('cache-config', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  describe('CACHE_TIMES', () => {
    it('should have all required cache time constants', () => {
      expect(CACHE_TIMES).toHaveProperty('REAL_TIME');
      expect(CACHE_TIMES).toHaveProperty('SHORT');
      expect(CACHE_TIMES).toHaveProperty('STANDARD');
    });

    it('should have correct time values', () => {
      expect(CACHE_TIMES.REAL_TIME).toBe(30 * 1000);
      expect(CACHE_TIMES.SHORT).toBe(2 * 60 * 1000);
    });
  });

  describe('GC_TIMES', () => {
    it('should have all required GC time constants', () => {
      expect(GC_TIMES).toHaveProperty('REAL_TIME');
      expect(GC_TIMES).toHaveProperty('SHORT');
    });
  });

  describe('CACHE_STRATEGIES', () => {
    it('should have strategies for all major data types', () => {
      expect(CACHE_STRATEGIES).toHaveProperty('PARAMETERS');
      expect(CACHE_STRATEGIES).toHaveProperty('USERS');
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have all required cache key constants', () => {
      expect(CACHE_KEYS).toHaveProperty('AUTH');
      expect(CACHE_KEYS).toHaveProperty('USERS');
    });
  });

  describe('getCacheStrategy', () => {
    it('should return PARAMETERS strategy for parameters key', () => {
      const strategy = getCacheStrategy([CACHE_KEYS.PARAMETERS]);
      expect(strategy).toEqual(CACHE_STRATEGIES.PARAMETERS);
    });

    it('should return default strategy for unknown keys', () => {
      const strategy = getCacheStrategy(['unknown']);
      expect(strategy.staleTime).toBe(CACHE_TIMES.STANDARD);
    });
  });

  describe('createOptimizedQueryClient', () => {
    it('should create a QueryClient', () => {
      const client = createOptimizedQueryClient();
      expect(client).toBeInstanceOf(QueryClient);
    });
  });

  describe('invalidateRelatedCaches', () => {
    it('should invalidate beneficiaries and related caches', () => {
      const spy = vi.spyOn(queryClient, 'invalidateQueries');
      invalidateRelatedCaches(queryClient, 'BENEFICIARIES');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('cacheUtils', () => {
    it('should have clearAll function', () => {
      expect(cacheUtils).toHaveProperty('clearAll');
    });

    it('should have clearEntityCache function', () => {
      expect(cacheUtils).toHaveProperty('clearEntityCache');
    });

    it('should have getCacheStats function', () => {
      expect(cacheUtils).toHaveProperty('getCacheStats');
    });
  });
});
