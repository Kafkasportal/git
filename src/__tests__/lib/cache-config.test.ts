/**
 * Tests for cache configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  CACHE_TIMES,
  GC_TIMES,
  CACHE_STRATEGIES,
  CACHE_KEYS,
  getCacheStrategy,
  invalidateRelatedCaches,
  createOptimizedQueryClient,
  cacheUtils,
} from '@/lib/cache-config';

describe('Cache Configuration', () => {
  describe('CACHE_TIMES', () => {
    it('should define all cache time constants', () => {
      expect(CACHE_TIMES.REAL_TIME).toBe(30 * 1000);
      expect(CACHE_TIMES.SHORT).toBe(2 * 60 * 1000);
      expect(CACHE_TIMES.STANDARD).toBe(5 * 60 * 1000);
      expect(CACHE_TIMES.MEDIUM).toBe(10 * 60 * 1000);
      expect(CACHE_TIMES.LONG).toBe(30 * 60 * 1000);
      expect(CACHE_TIMES.VERY_LONG).toBe(60 * 60 * 1000);
      expect(CACHE_TIMES.SESSION).toBe(Infinity);
    });

    it('should have ascending cache times', () => {
      expect(CACHE_TIMES.REAL_TIME).toBeLessThan(CACHE_TIMES.SHORT);
      expect(CACHE_TIMES.SHORT).toBeLessThan(CACHE_TIMES.STANDARD);
      expect(CACHE_TIMES.STANDARD).toBeLessThan(CACHE_TIMES.MEDIUM);
      expect(CACHE_TIMES.MEDIUM).toBeLessThan(CACHE_TIMES.LONG);
      expect(CACHE_TIMES.LONG).toBeLessThan(CACHE_TIMES.VERY_LONG);
    });
  });

  describe('GC_TIMES', () => {
    it('should define all garbage collection times', () => {
      expect(GC_TIMES.REAL_TIME).toBe(1 * 60 * 1000);
      expect(GC_TIMES.SHORT).toBe(5 * 60 * 1000);
      expect(GC_TIMES.STANDARD).toBe(10 * 60 * 1000);
      expect(GC_TIMES.MEDIUM).toBe(30 * 60 * 1000);
      expect(GC_TIMES.LONG).toBe(60 * 60 * 1000);
      expect(GC_TIMES.VERY_LONG).toBe(2 * 60 * 60 * 1000);
    });

    it('should have GC times longer than cache times', () => {
      expect(GC_TIMES.REAL_TIME).toBeGreaterThan(CACHE_TIMES.REAL_TIME);
      expect(GC_TIMES.SHORT).toBeGreaterThan(CACHE_TIMES.SHORT);
      expect(GC_TIMES.STANDARD).toBeGreaterThan(CACHE_TIMES.STANDARD);
    });
  });

  describe('CACHE_STRATEGIES', () => {
    it('should define strategy for parameters', () => {
      expect(CACHE_STRATEGIES.PARAMETERS).toMatchObject({
        staleTime: CACHE_TIMES.VERY_LONG,
        gcTime: GC_TIMES.VERY_LONG,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      });
    });

    it('should define strategy for real-time data', () => {
      expect(CACHE_STRATEGIES.TASKS).toMatchObject({
        staleTime: CACHE_TIMES.REAL_TIME,
        gcTime: GC_TIMES.REAL_TIME,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      });

      expect(CACHE_STRATEGIES.MESSAGES).toMatchObject({
        staleTime: CACHE_TIMES.REAL_TIME,
        gcTime: GC_TIMES.REAL_TIME,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      });

      expect(CACHE_STRATEGIES.MEETING_ACTION_ITEMS).toMatchObject({
        staleTime: CACHE_TIMES.REAL_TIME,
        gcTime: GC_TIMES.REAL_TIME,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      });

      expect(CACHE_STRATEGIES.WORKFLOW_NOTIFICATIONS).toMatchObject({
        staleTime: CACHE_TIMES.REAL_TIME,
        gcTime: GC_TIMES.REAL_TIME,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      });
    });

    it('should define strategy for beneficiaries', () => {
      expect(CACHE_STRATEGIES.BENEFICIARIES).toMatchObject({
        staleTime: CACHE_TIMES.LONG,
        gcTime: GC_TIMES.LONG,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      });
    });

    it('should define strategy for current user', () => {
      expect(CACHE_STRATEGIES.CURRENT_USER).toMatchObject({
        staleTime: CACHE_TIMES.SESSION,
        gcTime: GC_TIMES.LONG,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      });
    });
  });

  describe('CACHE_KEYS', () => {
    it('should define all cache key prefixes', () => {
      expect(CACHE_KEYS.AUTH).toBe('auth');
      expect(CACHE_KEYS.USERS).toBe('users');
      expect(CACHE_KEYS.BENEFICIARIES).toBe('beneficiaries');
      expect(CACHE_KEYS.DONATIONS).toBe('donations');
      expect(CACHE_KEYS.TASKS).toBe('tasks');
      expect(CACHE_KEYS.MEETINGS).toBe('meetings');
      expect(CACHE_KEYS.MEETING_DECISIONS).toBe('meeting-decisions');
      expect(CACHE_KEYS.MEETING_ACTION_ITEMS).toBe('meeting-action-items');
      expect(CACHE_KEYS.WORKFLOW_NOTIFICATIONS).toBe('workflow-notifications');
      expect(CACHE_KEYS.MESSAGES).toBe('messages');
      expect(CACHE_KEYS.PARAMETERS).toBe('parameters');
      expect(CACHE_KEYS.STATISTICS).toBe('statistics');
    });
  });

  describe('getCacheStrategy', () => {
    it('should return correct strategy for known keys', () => {
      expect(getCacheStrategy([CACHE_KEYS.PARAMETERS])).toEqual(CACHE_STRATEGIES.PARAMETERS);
      expect(getCacheStrategy([CACHE_KEYS.BENEFICIARIES])).toEqual(CACHE_STRATEGIES.BENEFICIARIES);
      expect(getCacheStrategy([CACHE_KEYS.TASKS])).toEqual(CACHE_STRATEGIES.TASKS);
      expect(getCacheStrategy([CACHE_KEYS.MEETING_DECISIONS])).toEqual(
        CACHE_STRATEGIES.MEETING_DECISIONS
      );
      expect(getCacheStrategy([CACHE_KEYS.MEETING_ACTION_ITEMS])).toEqual(
        CACHE_STRATEGIES.MEETING_ACTION_ITEMS
      );
      expect(getCacheStrategy([CACHE_KEYS.WORKFLOW_NOTIFICATIONS])).toEqual(
        CACHE_STRATEGIES.WORKFLOW_NOTIFICATIONS
      );
    });

    it('should return standard strategy for unknown keys', () => {
      const strategy = getCacheStrategy(['unknown-key']);
      expect(strategy.staleTime).toBe(CACHE_TIMES.STANDARD);
      expect(strategy.gcTime).toBe(GC_TIMES.STANDARD);
    });
  });

  describe('invalidateRelatedCaches', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient();
    });

    it('should invalidate beneficiaries and related caches', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      invalidateRelatedCaches(queryClient, 'BENEFICIARIES');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.BENEFICIARIES] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.STATISTICS] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.AID_REQUESTS] });
    });

    it('should invalidate donations and statistics', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      invalidateRelatedCaches(queryClient, 'DONATIONS');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.DONATIONS] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.STATISTICS] });
    });

    it('should invalidate meeting workflow caches when action items change', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      invalidateRelatedCaches(queryClient, 'MEETING_ACTION_ITEMS');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.MEETING_ACTION_ITEMS] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.MEETING_DECISIONS] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.MEETINGS] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [CACHE_KEYS.WORKFLOW_NOTIFICATIONS],
      });
    });

    it('should invalidate only entity cache for unknown entities', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      invalidateRelatedCaches(queryClient, 'REPORTS');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.REPORTS] });
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('createOptimizedQueryClient', () => {
    it('should create a QueryClient with optimized defaults', () => {
      const client = createOptimizedQueryClient();

      expect(client).toBeInstanceOf(QueryClient);

      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(CACHE_TIMES.STANDARD);
      expect(defaultOptions.queries?.gcTime).toBe(GC_TIMES.STANDARD);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
      expect(defaultOptions.queries?.retry).toBe(2);
    });
  });

  describe('cacheUtils', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient();
    });

    it('should clear all caches', () => {
      const clearSpy = vi.spyOn(queryClient, 'clear');

      cacheUtils.clearAll(queryClient);

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should clear entity cache', () => {
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');

      cacheUtils.clearEntityCache(queryClient, 'BENEFICIARIES');

      expect(removeSpy).toHaveBeenCalledWith({ queryKey: [CACHE_KEYS.BENEFICIARIES] });
    });

    it('should get cache stats', () => {
      const stats = cacheUtils.getCacheStats(queryClient);

      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('activeQueries');
      expect(stats).toHaveProperty('staleQueries');
      expect(stats).toHaveProperty('errorQueries');
      expect(typeof stats.totalQueries).toBe('number');
    });
  });
});
