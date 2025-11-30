'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getPendingMutations,
  getPendingMutationCount,
  removePendingMutation,
  updateMutationStatus,
  addPendingMutation,
  logSync,
  type PendingMutation,
} from '@/lib/indexed-db';
import { toast } from 'sonner';
import logger from '@/lib/logger';

// ============================================
// Types
// ============================================

interface UseOfflineSyncOptions {
  /** Auto-sync when coming online */
  autoSync?: boolean;
  /** Sync interval in ms (0 to disable) */
  syncInterval?: number;
  /** Max retries per mutation */
  maxRetries?: number;
  /** Show toast notifications */
  showNotifications?: boolean;
  /** Collections to sync */
  collections?: string[];
}

interface UseOfflineSyncReturn {
  /** Number of pending mutations */
  pendingCount: number;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: number | null;
  /** Sync errors */
  syncErrors: string[];
  /** Manually trigger sync */
  sync: () => Promise<void>;
  /** Add a mutation to the queue */
  queueMutation: (
    collection: string,
    type: 'create' | 'update' | 'delete',
    data: Record<string, unknown>
  ) => Promise<string>;
  /** Clear all pending mutations */
  clearQueue: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useOfflineSync(
  options: UseOfflineSyncOptions = {}
): UseOfflineSyncReturn {
  const {
    autoSync = true,
    syncInterval = 0,
    maxRetries = 3,
    showNotifications = true,
    collections,
  } = options;

  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const syncingRef = useRef(false);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingMutationCount();
      setPendingCount(count);
    } catch (error) {
      logger.error('Failed to get pending count', error);
    }
  }, []);

  // Sync mutations
  const sync = useCallback(async () => {
    if (syncingRef.current || !isOnline) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);
    setSyncErrors([]);

    try {
      const mutations = await getPendingMutations();

      // Filter by collections if specified
      const filtered = collections
        ? mutations.filter((m) => collections.includes(m.collection))
        : mutations;

      if (filtered.length === 0) {
        setLastSyncAt(Date.now());
        return;
      }

      // Sort by timestamp (oldest first)
      filtered.sort((a, b) => a.timestamp - b.timestamp);

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const mutation of filtered) {
        if (mutation.retryCount >= maxRetries) {
          errors.push(
            `${mutation.collection} işlemi ${maxRetries} deneme sonrası başarısız oldu`
          );
          failCount++;
          continue;
        }

        try {
          await updateMutationStatus(mutation.id, 'syncing');
          await syncMutation(mutation);
          await removePendingMutation(mutation.id);
          successCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Bilinmeyen hata';
          errors.push(`${mutation.collection}: ${errorMessage}`);
          await updateMutationStatus(mutation.id, 'failed');
          failCount++;
        }
      }

      // Log sync result
      await logSync(
        'sync',
        failCount === 0,
        `${successCount} başarılı, ${failCount} başarısız`
      );

      setLastSyncAt(Date.now());
      setSyncErrors(errors);

      // Show notification
      if (showNotifications) {
        if (successCount > 0 && failCount === 0) {
          toast.success(`${successCount} değişiklik senkronize edildi`);
        } else if (failCount > 0) {
          toast.error(
            `${successCount} başarılı, ${failCount} başarısız senkronizasyon`
          );
        }
      }
    } catch (error) {
      logger.error('Sync failed', error);
      setSyncErrors(['Senkronizasyon başarısız oldu']);
      await logSync('sync', false, String(error));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await updatePendingCount();
    }
  }, [isOnline, collections, maxRetries, showNotifications, updatePendingCount]);

  // Queue a mutation
  const queueMutation = useCallback(
    async (
      collection: string,
      type: 'create' | 'update' | 'delete',
      data: Record<string, unknown>
    ): Promise<string> => {
      const id = await addPendingMutation(collection, type, data);
      await updatePendingCount();

      if (showNotifications) {
        toast.info('Çevrimdışı olarak kaydedildi', {
          description: 'Bağlantı sağlandığında senkronize edilecek',
        });
      }

      return id;
    },
    [showNotifications, updatePendingCount]
  );

  // Clear queue
  const clearQueue = useCallback(async () => {
    const mutations = await getPendingMutations();
    for (const mutation of mutations) {
      await removePendingMutation(mutation.id);
    }
    await updatePendingCount();
  }, [updatePendingCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (autoSync && isOnline && pendingCount > 0) {
      sync();
    }
  }, [autoSync, isOnline, pendingCount, sync]);

  // Sync interval
  useEffect(() => {
    if (syncInterval <= 0 || !isOnline) return;

    const interval = setInterval(() => {
      if (pendingCount > 0) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [syncInterval, isOnline, pendingCount, sync]);

  // Initial count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncErrors,
    sync,
    queueMutation,
    clearQueue,
  };
}

// ============================================
// Helper: Sync Single Mutation
// ============================================

async function syncMutation(mutation: PendingMutation): Promise<void> {
  const endpoint = `/api/${mutation.collection}`;
  const method = getMutationMethod(mutation.type);

  // Handle delete - append ID to URL
  const url =
    mutation.type === 'delete' && mutation.data.$id
      ? `${endpoint}/${mutation.data.$id}`
      : endpoint;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: mutation.type !== 'delete' ? JSON.stringify(mutation.data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
}

function getMutationMethod(type: PendingMutation['type']): string {
  switch (type) {
    case 'create':
      return 'POST';
    case 'update':
      return 'PUT';
    case 'delete':
      return 'DELETE';
    default:
      return 'POST';
  }
}
