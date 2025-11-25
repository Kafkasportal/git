/**
 * Persistent Cache Implementation
 *
 * Provides IndexedDB-backed caching for offline support and improved performance.
 * Falls back to in-memory cache if IndexedDB is unavailable.
 */

import { CACHE_TIMES } from './cache-config';
import logger from './logger';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

const DB_NAME = 'portal-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache-store';
const CACHE_VERSION = '1.0.0';

/**
 * Persistent cache with IndexedDB backend
 */
export class PersistentCache {
  private static instance: PersistentCache;
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, CacheEntry>();
  private initPromise: Promise<void> | null = null;
  private useMemoryOnly = false;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  private constructor() {
    // Initialize on creation
    this.initPromise = this.initialize();
  }

  static getInstance(): PersistentCache {
    if (!PersistentCache.instance) {
      PersistentCache.instance = new PersistentCache();
    }
    return PersistentCache.instance;
  }

  /**
   * Initialize IndexedDB
   */
  private async initialize(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.indexedDB) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('[Cache] IndexedDB not available, using memory-only cache');
      }
      this.useMemoryOnly = true;
      return;
    }

    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          logger.error('[Cache] IndexedDB open error', { error: request.error });
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            objectStore.createIndex('ttl', 'ttl', { unique: false });
          }
        };
      });

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[Cache] IndexedDB initialized successfully');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[Cache] Failed to initialize IndexedDB, falling back to memory', { error });
      }
      this.useMemoryOnly = true;
      this.metrics.errors++;
    }
  }

  /**
   * Ensure the cache is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, data: T, ttl: number = CACHE_TIMES.STANDARD): Promise<void> {
    await this.ensureInitialized();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: CACHE_VERSION,
    };

    // Always set in memory cache for fast access
    this.memoryCache.set(key, entry);
    this.metrics.sets++;

    // Also persist to IndexedDB if available
    if (!this.useMemoryOnly && this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put({ key, ...entry });

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (_error) {
        logger.error('[Cache] IndexedDB set error', { error: _error });
        this.metrics.errors++;
        // Continue even if IndexedDB fails - we have memory cache
      }
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    // Check memory cache first (fastest)
    let entry = this.memoryCache.get(key);

    // If not in memory and IndexedDB is available, check there
    if (!entry && !this.useMemoryOnly && this.db) {
      try {
        entry = await new Promise<CacheEntry | undefined>((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(key);

          request.onsuccess = () => {
            const result = request.result;
            if (result) {
              // Extract the entry (remove the key property added by IndexedDB)
              const { key: _, ...cacheEntry } = result;
              resolve(cacheEntry as CacheEntry);
            } else {
              resolve(undefined);
            }
          };
          request.onerror = () => reject(request.error);
        });

        // If found in IndexedDB, update memory cache
        if (entry) {
          this.memoryCache.set(key, entry);
        }
      } catch (_error) {
        logger.error('[Cache] IndexedDB get error', { error: _error });
        this.metrics.errors++;
      }
    }

    // Check if entry exists and is valid
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (entry.ttl !== Infinity && now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      await this.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      // Version mismatch, remove outdated entry
      await this.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return entry.data as T;
  }

  /**
   * Check if a key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    // Remove from memory cache
    this.memoryCache.delete(key);
    this.metrics.deletes++;

    // Also remove from IndexedDB if available
    if (!this.useMemoryOnly && this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.delete(key);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (_error) {
        logger.error('[Cache] IndexedDB delete error', { error: _error });
        this.metrics.errors++;
      }
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB if available
    if (!this.useMemoryOnly && this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (_error) {
        logger.error('[Cache] IndexedDB clear error', { error: _error });
        this.metrics.errors++;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Cache] All caches cleared');
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    await this.ensureInitialized();

    const now = Date.now();
    let cleanedCount = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.ttl !== Infinity && now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean IndexedDB if available
    if (!this.useMemoryOnly && this.db) {
      try {
        const expiredKeys = await new Promise<string[]>((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.openCursor();
          const expired: string[] = [];

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const entry = cursor.value;
              if (entry.ttl !== Infinity && now - entry.timestamp > entry.ttl) {
                expired.push(entry.key);
              }
              cursor.continue();
            } else {
              resolve(expired);
            }
          };
          request.onerror = () => reject(request.error);
        });

        // Delete expired entries
        if (expiredKeys.length > 0) {
          await new Promise<void>((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            expiredKeys.forEach((key) => store.delete(key));

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });

          cleanedCount += expiredKeys.length;
        }
      } catch (_error) {
        logger.error('[Cache] IndexedDB cleanup error', { error: _error });
        this.metrics.errors++;
      }
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      logger.debug('[Cache] Cleaned up expired entries', { count: cleanedCount });
    }

    return cleanedCount;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): Readonly<CacheMetrics> {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Get cache size information
   */
  async getSize(): Promise<{ memory: number; indexedDB: number }> {
    await this.ensureInitialized();

    const memorySize = this.memoryCache.size;
    let indexedDBSize = 0;

    if (!this.useMemoryOnly && this.db) {
      try {
        indexedDBSize = await new Promise<number>((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.count();

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch (_error) {
        logger.error('[Cache] IndexedDB size query error', { error: _error });
        this.metrics.errors++;
      }
    }

    return { memory: memorySize, indexedDB: indexedDBSize };
  }

  /**
   * Export cache data (for debugging or migration)
   */
  async export(): Promise<Record<string, CacheEntry>> {
    await this.ensureInitialized();

    const exported: Record<string, CacheEntry> = {};

    if (!this.useMemoryOnly && this.db) {
      try {
        const entries = await new Promise<Array<{ key: string } & CacheEntry>>(
          (resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          }
        );

        entries.forEach((entry) => {
          const { key, ...cacheEntry } = entry;
          exported[key] = cacheEntry;
        });
      } catch (_error) {
        logger.error('[Cache] IndexedDB export error', { error: _error });
        this.metrics.errors++;
      }
    }

    return exported;
  }
}

/**
 * Get the singleton persistent cache instance
 */
export const persistentCache = PersistentCache.getInstance();

/**
 * Helper to get cache hit rate
 */
export function getCacheHitRate(): number {
  const metrics = persistentCache.getMetrics();
  const total = metrics.hits + metrics.misses;
  return total > 0 ? (metrics.hits / total) * 100 : 0;
}
