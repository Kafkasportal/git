/**
 * Tests for offline sync functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  queueOfflineMutation,
  getPendingMutations,
  removeMutation,
  syncPendingMutations,
  getOfflineStats,
  isOfflineModeSupported,
  getFailedMutations,
  retryMutation,
  clearAllMutations,
} from '@/lib/offline-sync';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock IndexedDB
const mockDB: Record<string, any[]> = {};

beforeEach(() => {
  // Reset mock DB
  Object.keys(mockDB).forEach((key) => delete mockDB[key]);
  mockDB['pending-mutations'] = [];

  // Mock IndexedDB
  global.indexedDB = {
    open: vi.fn((_name: string) => {
      const request = {
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: {
          objectStoreNames: {
            contains: vi.fn(() => true),
          },
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              add: vi.fn((data: any) => {
                mockDB['pending-mutations'].push(data);
              }),
              get: vi.fn((id: string) => ({
                onsuccess: null,
                result: mockDB['pending-mutations'].find((m) => m.id === id),
              })),
              getAll: vi.fn(() => ({
                onsuccess: null,
                result: mockDB['pending-mutations'],
              })),
              delete: vi.fn((id: string) => {
                const index = mockDB['pending-mutations'].findIndex((m) => m.id === id);
                if (index > -1) {
                  mockDB['pending-mutations'].splice(index, 1);
                }
              }),
              put: vi.fn((data: any) => {
                const index = mockDB['pending-mutations'].findIndex((m) => m.id === data.id);
                if (index > -1) {
                  mockDB['pending-mutations'][index] = data;
                } else {
                  mockDB['pending-mutations'].push(data);
                }
              }),
              clear: vi.fn(() => {
                mockDB['pending-mutations'] = [];
              }),
            })),
            oncomplete: null,
            onerror: null,
          })),
        },
      } as any;

      // Simulate successful open
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess({ target: request } as any);
        }
      }, 0);

      return request as any;
    }),
  } as any;

  // Mock fetch
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('offline-sync', () => {
  describe('queueOfflineMutation', () => {
    it('should add mutation to IndexedDB with correct structure', async () => {
      const mutation = {
        type: 'create' as const,
        collection: 'beneficiaries',
        data: { name: 'Test' },
      };

      await queueOfflineMutation(mutation);

      const mutations = await getPendingMutations();
      expect(mutations.length).toBe(1);
      expect(mutations[0]).toMatchObject({
        type: 'create',
        collection: 'beneficiaries',
        data: { name: 'Test' },
      });
      expect(mutations[0]).toHaveProperty('id');
      expect(mutations[0]).toHaveProperty('timestamp');
      expect(mutations[0]).toHaveProperty('retryCount', 0);
    });
  });

  describe('getPendingMutations', () => {
    it('should retrieve and sort mutations by timestamp', async () => {
      const now = Date.now();
      mockDB['pending-mutations'] = [
        { id: '1', timestamp: now + 1000, type: 'create', collection: 'test', data: {}, retryCount: 0 },
        { id: '2', timestamp: now, type: 'update', collection: 'test', data: {}, retryCount: 0 },
        { id: '3', timestamp: now + 500, type: 'delete', collection: 'test', data: {}, retryCount: 0 },
      ];

      const mutations = await getPendingMutations();
      expect(mutations[0].id).toBe('2');
      expect(mutations[1].id).toBe('3');
      expect(mutations[2].id).toBe('1');
    });
  });

  describe('removeMutation', () => {
    it('should delete mutation from queue', async () => {
      mockDB['pending-mutations'] = [
        { id: '1', timestamp: Date.now(), type: 'create', collection: 'test', data: {}, retryCount: 0 },
      ];

      await removeMutation('1');

      const mutations = await getPendingMutations();
      expect(mutations.length).toBe(0);
    });
  });

  describe('syncPendingMutations', () => {
    it('should sync mutations successfully and remove them from queue', async () => {
      mockDB['pending-mutations'] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'create',
          collection: 'beneficiaries',
          data: { name: 'Test' },
          retryCount: 0,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await syncPendingMutations();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/beneficiaries'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle conflicts with last-write-wins strategy', async () => {
      mockDB['pending-mutations'] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'update',
          collection: 'beneficiaries',
          data: { id: '123', name: 'Test' },
          retryCount: 0,
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          statusText: 'Conflict',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
        });

      const result = await syncPendingMutations();

      expect(result.success).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Force-Overwrite': 'true',
          }),
        })
      );
    });

    it('should increment retry count on failure', async () => {
      mockDB['pending-mutations'] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'create',
          collection: 'beneficiaries',
          data: { name: 'Test' },
          retryCount: 0,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await syncPendingMutations();

      expect(result.failed).toBe(1);
      const mutations = await getPendingMutations();
      expect(mutations[0].retryCount).toBe(1);
      expect(mutations[0]).toHaveProperty('lastRetryAt');
    });

    it('should skip mutations exceeding retry limit', async () => {
      mockDB['pending-mutations'] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'create',
          collection: 'beneficiaries',
          data: { name: 'Test' },
          retryCount: 3,
        },
      ];

      const result = await syncPendingMutations();

      expect(result.failed).toBe(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should implement exponential backoff', async () => {
      const now = Date.now();
      mockDB['pending-mutations'] = [
        {
          id: '1',
          timestamp: now,
          type: 'create',
          collection: 'beneficiaries',
          data: { name: 'Test' },
          retryCount: 1,
          lastRetryAt: now - 1000, // 1 second ago, but need 2 seconds (2^1 * 1000)
        },
      ];

      const result = await syncPendingMutations();

      // Should skip due to backoff
      expect(result.failed).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getOfflineStats', () => {
    it('should return correct counts and oldest timestamp', async () => {
      const now = Date.now();
      mockDB['pending-mutations'] = [
        { id: '1', timestamp: now - 1000, type: 'create', collection: 'test', data: {}, retryCount: 0 },
        { id: '2', timestamp: now, type: 'update', collection: 'test', data: {}, retryCount: 2 },
        { id: '3', timestamp: now - 500, type: 'delete', collection: 'test', data: {}, retryCount: 3 },
      ];

      const stats = await getOfflineStats();

      expect(stats.pendingCount).toBe(3);
      expect(stats.failedCount).toBe(1); // Only retryCount >= 3
      expect(stats.oldestMutation).toBeInstanceOf(Date);
    });
  });

  describe('isOfflineModeSupported', () => {
    it('should return true when IndexedDB is available', () => {
      expect(isOfflineModeSupported()).toBe(true);
    });
  });

  describe('getFailedMutations', () => {
    it('should return mutations with retryCount >= 3', async () => {
      mockDB['pending-mutations'] = [
        { id: '1', timestamp: Date.now(), type: 'create', collection: 'test', data: {}, retryCount: 0 },
        { id: '2', timestamp: Date.now(), type: 'update', collection: 'test', data: {}, retryCount: 3 },
        { id: '3', timestamp: Date.now(), type: 'delete', collection: 'test', data: {}, retryCount: 4 },
      ];

      const failed = await getFailedMutations();

      expect(failed.length).toBe(2);
      expect(failed.every((m) => m.retryCount >= 3)).toBe(true);
    });
  });

  describe('retryMutation', () => {
    it('should reset retry count and lastRetryAt', async () => {
      mockDB['pending-mutations'] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'create',
          collection: 'test',
          data: {},
          retryCount: 3,
          lastRetryAt: Date.now(),
        },
      ];

      await retryMutation('1');

      const mutations = await getPendingMutations();
      expect(mutations[0].retryCount).toBe(0);
      expect(mutations[0].lastRetryAt).toBeUndefined();
    });
  });

  describe('clearAllMutations', () => {
    it('should remove all mutations from queue', async () => {
      mockDB['pending-mutations'] = [
        { id: '1', timestamp: Date.now(), type: 'create', collection: 'test', data: {}, retryCount: 0 },
        { id: '2', timestamp: Date.now(), type: 'update', collection: 'test', data: {}, retryCount: 0 },
      ];

      await clearAllMutations();

      const mutations = await getPendingMutations();
      expect(mutations.length).toBe(0);
    });
  });
});

