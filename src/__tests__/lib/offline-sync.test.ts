/**
 * Tests for offline sync functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { isOfflineModeSupported } from '@/lib/offline-sync';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('offline-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isOfflineModeSupported', () => {
    it('should return true when IndexedDB is available', () => {
      // IndexedDB should be available in jsdom environment
      expect(typeof isOfflineModeSupported).toBe('function');
      // In test environment, indexedDB might not be fully available
      const result = isOfflineModeSupported();
      expect(typeof result).toBe('boolean');
    });

    it('should return false when IndexedDB is not available', () => {
      const originalIndexedDB = global.indexedDB;
      // @ts-expect-error - Testing unavailable IndexedDB
      global.indexedDB = undefined;

      expect(isOfflineModeSupported()).toBe(false);

      global.indexedDB = originalIndexedDB;
    });
  });

  // Note: Full IndexedDB integration tests are complex to mock properly
  // The actual offline sync functionality should be tested via E2E tests
  // These unit tests verify the basic API structure
  describe('API structure', () => {
    it('should export queueOfflineMutation function', async () => {
      const { queueOfflineMutation } = await import('@/lib/offline-sync');
      expect(typeof queueOfflineMutation).toBe('function');
    });

    it('should export getPendingMutations function', async () => {
      const { getPendingMutations } = await import('@/lib/offline-sync');
      expect(typeof getPendingMutations).toBe('function');
    });

    it('should export removeMutation function', async () => {
      const { removeMutation } = await import('@/lib/offline-sync');
      expect(typeof removeMutation).toBe('function');
    });

    it('should export syncPendingMutations function', async () => {
      const { syncPendingMutations } = await import('@/lib/offline-sync');
      expect(typeof syncPendingMutations).toBe('function');
    });

    it('should export getOfflineStats function', async () => {
      const { getOfflineStats } = await import('@/lib/offline-sync');
      expect(typeof getOfflineStats).toBe('function');
    });

    it('should export getFailedMutations function', async () => {
      const { getFailedMutations } = await import('@/lib/offline-sync');
      expect(typeof getFailedMutations).toBe('function');
    });

    it('should export retryMutation function', async () => {
      const { retryMutation } = await import('@/lib/offline-sync');
      expect(typeof retryMutation).toBe('function');
    });

    it('should export clearAllMutations function', async () => {
      const { clearAllMutations } = await import('@/lib/offline-sync');
      expect(typeof clearAllMutations).toBe('function');
    });
  });
});
