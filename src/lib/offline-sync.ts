/**
 * Offline Data Sync Utility
 * Handles offline mutations and syncs them when online
 */

import logger from '@/lib/logger';

export interface OfflineMutation {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: Record<string, unknown>;
  userId?: string;
  retryCount: number;
  lastRetryAt?: number;
}

/**
 * Collection to API endpoint mapping
 */
const COLLECTION_ENDPOINT_MAP: Record<string, string> = {
  beneficiaries: '/api/beneficiaries',
  donations: '/api/donations',
  messages: '/api/messages',
  tasks: '/api/tasks',
  meetings: '/api/meetings',
  users: '/api/users',
  partners: '/api/partners',
  scholarships: '/api/scholarships',
  aidApplications: '/api/aid-applications',
};

const DB_NAME = 'kafkasder-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-mutations';

/**
 * Initialize IndexedDB for offline storage
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for pending mutations
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('collection', 'collection', { unique: false });
        store.createIndex('retryCount', 'retryCount', { unique: false });
      } else {
        // Add retryCount index if it doesn't exist
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains('retryCount')) {
            store.createIndex('retryCount', 'retryCount', { unique: false });
          }
        }
      }
    };
  });
}

/**
 * Save a mutation to offline queue
 */
export async function queueOfflineMutation(
  mutation: Omit<OfflineMutation, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const offlineMutation: OfflineMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    store.add(offlineMutation);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    logger.info('Offline mutation queued', { mutation: offlineMutation });
  } catch (error) {
    logger.error('Failed to queue offline mutation', { error });
    throw error;
  }
}

/**
 * Get all pending mutations
 */
export async function getPendingMutations(): Promise<OfflineMutation[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Failed to get pending mutations', { error });
    return [];
  }
}

/**
 * Remove a mutation from queue after successful sync
 */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    logger.info('Mutation removed from queue', { id });
  } catch (error) {
    logger.error('Failed to remove mutation', { error, id });
  }
}

/**
 * Update mutation retry count and timestamp
 */
async function updateMutationRetry(id: string, retryCount: number): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const mutation = request.result as OfflineMutation;
        if (mutation) {
          mutation.retryCount = retryCount;
          mutation.lastRetryAt = Date.now();
          store.put(mutation);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    logger.error('Failed to update mutation retry', { error, id });
  }
}

/**
 * Get failed mutations (exceeded retry limit)
 */
export async function getFailedMutations(): Promise<OfflineMutation[]> {
  try {
    const mutations = await getPendingMutations();
    return mutations.filter((m) => m.retryCount >= 3);
  } catch (error) {
    logger.error('Failed to get failed mutations', { error });
    return [];
  }
}

/**
 * Retry a failed mutation by resetting its retry count
 */
export async function retryMutation(id: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const mutation = request.result as OfflineMutation;
        if (mutation) {
          mutation.retryCount = 0;
          mutation.lastRetryAt = undefined;
          store.put(mutation);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    logger.info('Mutation retry count reset', { id });
  } catch (error) {
    logger.error('Failed to retry mutation', { error, id });
    throw error;
  }
}

/**
 * Clear all pending mutations (use with caution)
 */
export async function clearAllMutations(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    logger.info('All mutations cleared');
  } catch (error) {
    logger.error('Failed to clear mutations', { error });
  }
}

/**
 * Sync pending mutations to server
 * Implements last-write-wins conflict resolution with retry logic and exponential backoff
 */
export async function syncPendingMutations(): Promise<{ success: number; failed: number }> {
  logger.info('Starting offline mutation sync');

  const mutations = await getPendingMutations();
  let success = 0;
  let failed = 0;

  // Sort by timestamp to ensure correct order (oldest first)
  const sortedMutations = [...mutations].sort((a, b) => a.timestamp - b.timestamp);

  for (const mutation of sortedMutations) {
    // Skip mutations that exceeded retry limit
    if (mutation.retryCount >= 3) {
      logger.warn('Mutation exceeded retry limit, skipping', { mutation });
      failed++;
      continue;
    }

    // Check exponential backoff delay
    if (mutation.lastRetryAt) {
      const backoffDelay = Math.pow(2, mutation.retryCount) * 1000; // 2^retryCount seconds
      const timeSinceLastRetry = Date.now() - mutation.lastRetryAt;
      if (timeSinceLastRetry < backoffDelay) {
        logger.info('Mutation in backoff period, skipping', {
          mutation,
          remainingMs: backoffDelay - timeSinceLastRetry,
        });
        continue;
      }
    }

    try {
      logger.info('Syncing mutation', { mutation });

      // Get endpoint from collection map or use default
      const baseEndpoint =
        COLLECTION_ENDPOINT_MAP[mutation.collection] || `/api/${mutation.collection}`;

      // For update/delete, append document ID if present
      let endpoint = baseEndpoint;
      if ((mutation.type === 'update' || mutation.type === 'delete') && mutation.data) {
        const docId = (mutation.data.id || mutation.data.$id) as string | undefined;
        if (docId) {
          endpoint = `${baseEndpoint}/${docId}`;
        }
      }

      const method =
        mutation.type === 'create' ? 'POST' : mutation.type === 'update' ? 'PUT' : 'DELETE';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mutation.data),
      });

      if (!response.ok) {
        // Handle conflict (409) with last-write-wins strategy
        if (response.status === 409) {
          logger.warn('Conflict detected, applying last-write-wins', { mutation });
          // Force update by retrying with overwrite flag
          const retryResponse = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'X-Force-Overwrite': 'true',
            },
            body: JSON.stringify(mutation.data),
          });

          if (!retryResponse.ok) {
            throw new Error(`Retry failed: ${retryResponse.status}`);
          }
        } else {
          // Increment retry count for other errors
          const newRetryCount = mutation.retryCount + 1;
          await updateMutationRetry(mutation.id, newRetryCount);
          logger.warn('Mutation sync failed, incrementing retry count', {
            mutation,
            retryCount: newRetryCount,
            status: response.status,
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      await removeMutation(mutation.id);
      success++;
    } catch (error) {
      logger.error('Failed to sync mutation', { error, mutation });
      // Retry count already incremented in try block for non-409 errors
      if (mutation.retryCount < 3) {
        failed++;
      }
      // Continue with next mutation instead of stopping
    }
  }

  logger.info('Offline mutation sync completed', { success, failed, total: mutations.length });

  return { success, failed };
}

/**
 * Check if offline mode is available (IndexedDB supported)
 */
export function isOfflineModeSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Get offline storage statistics
 */
export async function getOfflineStats(): Promise<{
  pendingCount: number;
  failedCount: number;
  oldestMutation?: Date;
  totalSize: number;
}> {
  const mutations = await getPendingMutations();
  const failedMutations = mutations.filter((m) => m.retryCount >= 3);

  return {
    pendingCount: mutations.length,
    failedCount: failedMutations.length,
    oldestMutation:
      mutations.length > 0 ? new Date(Math.min(...mutations.map((m) => m.timestamp))) : undefined,
    totalSize: new Blob([JSON.stringify(mutations)]).size,
  };
}

/**
 * Hook for using offline sync in components
 */
export function useOfflineSync() {
  const queue = (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) =>
    queueOfflineMutation(mutation);

  const sync = () => syncPendingMutations();

  const getStats = () => getOfflineStats();

  const isSupported = isOfflineModeSupported();

  return {
    queue,
    sync,
    getStats,
    isSupported,
  };
}
