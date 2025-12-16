/**
 * IndexedDB Utility Library
 * Provides a type-safe wrapper around IndexedDB for offline data storage
 */

// ============================================
// Types
// ============================================

export interface DBConfig {
  name: string;
  version: number;
  stores: StoreConfig[];
}

export interface StoreConfig {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

export interface PendingMutation {
  id: string;
  collection: string;
  type: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedData<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
}

// ============================================
// Database Configuration
// ============================================

const DB_NAME = 'kafkasder-offline';
const DB_VERSION = 2;

const STORES: StoreConfig[] = [
  {
    name: 'pending-mutations',
    keyPath: 'id',
    indexes: [
      { name: 'by-collection', keyPath: 'collection' },
      { name: 'by-timestamp', keyPath: 'timestamp' },
      { name: 'by-status', keyPath: 'status' },
    ],
  },
  {
    name: 'cached-data',
    keyPath: 'key',
    indexes: [
      { name: 'by-timestamp', keyPath: 'timestamp' },
      { name: 'by-expiry', keyPath: 'expiresAt' },
    ],
  },
  {
    name: 'sync-logs',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [{ name: 'by-timestamp', keyPath: 'timestamp' }],
  },
];

// ============================================
// Database Connection
// ============================================

let dbInstance: IDBDatabase | null = null;

/**
 * Create indexes for a store
 */
function createStoreIndexes(store: IDBObjectStore, indexes: IndexConfig[] | undefined): void {
  if (!indexes) return;
  
  indexes.forEach((indexConfig) => {
    store.createIndex(indexConfig.name, indexConfig.keyPath, {
      unique: indexConfig.unique ?? false,
    });
  });
}

/**
 * Create a single store in the database
 */
function createStore(db: IDBDatabase, storeConfig: StoreConfig): void {
  // Delete existing store if exists (for upgrades)
  if (db.objectStoreNames.contains(storeConfig.name)) {
    db.deleteObjectStore(storeConfig.name);
  }

  // Create store
  const store = db.createObjectStore(storeConfig.name, {
    keyPath: storeConfig.keyPath,
    autoIncrement: storeConfig.autoIncrement,
  });

  // Create indexes
  createStoreIndexes(store, storeConfig.indexes);
}

/**
 * Handle database upgrade by creating all stores
 */
function handleDatabaseUpgrade(db: IDBDatabase): void {
  STORES.forEach((storeConfig) => {
    createStore(db, storeConfig);
  });
}

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`IndexedDB açılamadı: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      handleDatabaseUpgrade(db);
    };
  });
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// ============================================
// Generic CRUD Operations
// ============================================

export async function dbGet<T>(
  storeName: string,
  key: IDBValidKey
): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut<T>(storeName: string, data: T): Promise<IDBValidKey> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbDelete(
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function dbClear(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function dbCount(storeName: string): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// Pending Mutations API
// ============================================

export async function addPendingMutation(
  collection: string,
  type: PendingMutation['type'],
  data: Record<string, unknown>
): Promise<string> {
  const id = `${collection}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const mutation: PendingMutation = {
    id,
    collection,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await dbPut('pending-mutations', mutation);

  // Request background sync if available
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-offline-data');
    } catch {
      // Sync not available, will sync on reconnect
    }
  }

  return id;
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return dbGetAll<PendingMutation>('pending-mutations');
}

export async function getPendingMutationsByCollection(
  collection: string
): Promise<PendingMutation[]> {
  return dbGetByIndex<PendingMutation>(
    'pending-mutations',
    'by-collection',
    collection
  );
}

export async function updateMutationStatus(
  id: string,
  status: PendingMutation['status']
): Promise<void> {
  const mutation = await dbGet<PendingMutation>('pending-mutations', id);
  if (mutation) {
    mutation.status = status;
    mutation.retryCount += 1;
    await dbPut('pending-mutations', mutation);
  }
}

export async function removePendingMutation(id: string): Promise<void> {
  await dbDelete('pending-mutations', id);
}

export async function getPendingMutationCount(): Promise<number> {
  return dbCount('pending-mutations');
}

// ============================================
// Cached Data API
// ============================================

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function cacheData<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<void> {
  const cached: CachedData<T> = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };

  await dbPut('cached-data', cached);
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const cached = await dbGet<CachedData<T>>('cached-data', key);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (cached.expiresAt && cached.expiresAt < Date.now()) {
    await dbDelete('cached-data', key);
    return null;
  }

  return cached.data;
}

export async function removeCachedData(key: string): Promise<void> {
  await dbDelete('cached-data', key);
}

export async function clearExpiredCache(): Promise<number> {
  const db = await openDatabase();
  const now = Date.now();
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cached-data', 'readwrite');
    const store = transaction.objectStore('cached-data');
    const index = store.index('by-expiry');
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve(deletedCount);
    transaction.onerror = () => reject(transaction.error);
  });
}

// ============================================
// Sync Logging
// ============================================

interface SyncLog {
  id?: number;
  timestamp: number;
  action: string;
  success: boolean;
  details?: string;
}

export async function logSync(
  action: string,
  success: boolean,
  details?: string
): Promise<void> {
  const log: SyncLog = {
    timestamp: Date.now(),
    action,
    success,
    details,
  };

  await dbPut('sync-logs', log);
}

export async function getSyncLogs(limit: number = 50): Promise<SyncLog[]> {
  const logs = await dbGetAll<SyncLog>('sync-logs');
  return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export async function clearSyncLogs(): Promise<void> {
  await dbClear('sync-logs');
}

// ============================================
// Utility Functions
// ============================================

export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }

  return { usage: 0, quota: 0, percentUsed: 0 };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return navigator.storage.persist();
  }
  return false;
}
