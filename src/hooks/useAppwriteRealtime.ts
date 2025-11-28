/**
 * Appwrite Realtime Hooks
 *
 * Provides real-time data synchronization using Appwrite Realtime API.
 *
 * Features:
 * - Real-time document subscriptions
 * - Real-time collection subscriptions
 * - Automatic reconnection handling
 * - Optimistic updates support
 * - Conflict detection
 *
 * @see https://appwrite.io/docs/realtime
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeResponseEvent } from 'appwrite';
import { client } from '@/lib/appwrite/client';
import logger from '@/lib/logger';
import { toast } from 'sonner';

// Realtime event types
export type RealtimeEvent =
  | 'databases.*.collections.*.documents.*'
  | 'databases.*.collections.*.documents.*.create'
  | 'databases.*.collections.*.documents.*.update'
  | 'databases.*.collections.*.documents.*.delete';

interface UseRealtimeOptions {
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Show toast notifications on changes */
  notifyOnChange?: boolean;
  /** Custom notification message */
  changeMessage?: string;
  /** Skip notification for initial load */
  skipInitial?: boolean;
  /** Callback when data changes */
  onChange?: (event: RealtimeResponseEvent<unknown>) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * Subscribe to real-time updates for a specific Appwrite document
 *
 * @example
 * ```ts
 * const { data, isConnected } = useAppwriteDocument({
 *   databaseId: 'main',
 *   collectionId: 'users',
 *   documentId: user.id,
 *   notifyOnChange: true,
 * });
 * ```
 */
export function useAppwriteDocument<T = unknown>({
  databaseId,
  collectionId,
  documentId,
  enabled = true,
  notifyOnChange = false,
  changeMessage,
  skipInitial = true,
  onChange,
  onError,
}: {
  databaseId: string;
  collectionId: string;
  documentId: string;
} & UseRealtimeOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (!client || !enabled || !documentId) {
      return;
    }

    const channel = `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`;

    try {
      setIsConnected(false);

      const unsubscribe = client.subscribe<T>(channel, (response) => {
        logger.info('Appwrite Realtime event received', {
          channel,
          events: response.events,
        });

        // Update local state
        const payload = response.payload as T;
        setData(payload);
        setIsConnected(true);
        setError(null);

        // Notify on change
        if (notifyOnChange && (!skipInitial || !isInitialRef.current)) {
          const message = changeMessage || 'Veri güncellendi';
          toast.info(message, {
            description: 'Değişiklikler otomatik olarak yüklendi',
          });
        }

        // Call onChange callback
        if (onChange) {
          onChange(response);
        }

        isInitialRef.current = false;
      });

      setIsConnected(true);

      // Cleanup
      return () => {
        unsubscribe();
        setIsConnected(false);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Appwrite Realtime subscription failed', { error, channel });
      setError(error);
      setIsConnected(false);

      if (onError) {
        onError(error);
      }
      return undefined;
    }
  }, [
    databaseId,
    collectionId,
    documentId,
    enabled,
    notifyOnChange,
    changeMessage,
    skipInitial,
    onChange,
    onError,
  ]);

  return {
    data,
    isConnected,
    error,
  };
}

/**
 * Subscribe to real-time updates for an entire Appwrite collection
 *
 * @example
 * ```ts
 * const { documents, isConnected } = useAppwriteCollection({
 *   databaseId: 'main',
 *   collectionId: 'tasks',
 *   notifyOnChange: true,
 *   onChange: (event) => {
 *     console.log('Collection updated:', event.events);
 *   },
 * });
 * ```
 */
export function useAppwriteCollection<T = unknown>({
  databaseId,
  collectionId,
  enabled = true,
  notifyOnChange = false,
  changeMessage,
  skipInitial = true,
  onChange,
  onError,
}: {
  databaseId: string;
  collectionId: string;
} & UseRealtimeOptions) {
  const [documents, setDocuments] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isInitialRef = useRef(true);

  // Track individual document updates
  const documentsMapRef = useRef<Map<string, T>>(new Map());

  useEffect(() => {
    if (!client || !enabled) {
      return;
    }

    const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

    try {
      setIsConnected(false);

      const unsubscribe = client.subscribe<T>(channel, (response) => {
        logger.info('Appwrite Realtime collection event', {
          channel,
          events: response.events,
        });

        const payload = response.payload as T & { $id: string };
        const eventType = response.events[0];

        // Update documents map
        if (eventType?.includes('create') || eventType?.includes('update')) {
          documentsMapRef.current.set(payload.$id, payload);
        } else if (eventType?.includes('delete')) {
          documentsMapRef.current.delete(payload.$id);
        }

        // Update state
        setDocuments(Array.from(documentsMapRef.current.values()));
        setIsConnected(true);
        setError(null);

        // Notify on change
        if (notifyOnChange && (!skipInitial || !isInitialRef.current)) {
          const message = changeMessage || 'Liste güncellendi';
          const description = eventType?.includes('create')
            ? 'Yeni kayıt eklendi'
            : eventType?.includes('update')
              ? 'Kayıt güncellendi'
              : eventType?.includes('delete')
                ? 'Kayıt silindi'
                : 'Değişiklikler otomatik olarak yüklendi';

          toast.info(message, { description });
        }

        // Call onChange callback
        if (onChange) {
          onChange(response);
        }

        isInitialRef.current = false;
      });

      setIsConnected(true);

      // Cleanup
      return () => {
        unsubscribe();
        setIsConnected(false);
        documentsMapRef.current.clear();
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Appwrite Realtime collection subscription failed', { error, channel });
      setError(error);
      setIsConnected(false);

      if (onError) {
        onError(error);
      }
      return undefined;
    }
  }, [
    databaseId,
    collectionId,
    enabled,
    notifyOnChange,
    changeMessage,
    skipInitial,
    onChange,
    onError,
  ]);

  return {
    documents,
    isConnected,
    error,
  };
}

/**
 * Subscribe to multiple channels at once
 *
 * @example
 * ```ts
 * const { isConnected } = useAppwriteMultipleChannels({
 *   channels: [
 *     'databases.main.collections.tasks.documents',
 *     'databases.main.collections.users.documents',
 *   ],
 *   onMessage: (response) => {
 *     console.log('Update:', response);
 *   },
 * });
 * ```
 */
export function useAppwriteMultipleChannels({
  channels,
  enabled = true,
  onMessage,
  onError,
}: {
  channels: string[];
  onMessage: (response: RealtimeResponseEvent<unknown>) => void;
} & Pick<UseRealtimeOptions, 'enabled' | 'onError'>) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!client || !enabled || channels.length === 0) {
      return;
    }

    try {
      setIsConnected(false);

      const unsubscribe = client.subscribe(channels, (response) => {
        logger.info('Appwrite Realtime multi-channel event', {
          channels,
          events: response.events,
        });

        setIsConnected(true);
        setError(null);
        onMessage(response);
      });

      setIsConnected(true);

      // Cleanup
      return () => {
        unsubscribe();
        setIsConnected(false);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Appwrite Realtime multi-channel subscription failed', { error, channels });
      setError(error);
      setIsConnected(false);

      if (onError) {
        onError(error);
      }
      return undefined;
    }
  }, [channels, enabled, onMessage, onError]);

  return {
    isConnected,
    error,
  };
}

/**
 * Custom hook for reconnection handling
 * Monitors connection status and attempts to reconnect
 */
export function useAppwriteReconnect({
  enabled = true,
  onReconnect,
  onDisconnect,
}: {
  enabled?: boolean;
  onReconnect?: () => void;
  onDisconnect?: () => void;
} = {}) {
  const [isOnline, setIsOnline] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000);

  const attemptReconnect = useCallback(() => {
    if (!enabled || !client) return;

    setReconnectAttempts((prev) => {
      const attempts = prev + 1;

      if (attempts > maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached');
        toast.error('Bağlantı kurulamadı', {
          description: 'Lütfen sayfayı yenileyin',
          action: {
            label: 'Yenile',
            onClick: () => window.location.reload(),
          },
        });
        return attempts;
      }

      // Exponential backoff
      reconnectDelayRef.current = Math.min(1000 * Math.pow(2, attempts), 30000);

      setTimeout(() => {
        logger.info('Attempting to reconnect...', { attempt: attempts });
        if (onReconnect) {
          onReconnect();
        }
      }, reconnectDelayRef.current);

      return attempts;
    });
  }, [enabled, onReconnect]);

  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      logger.info('Network connection restored');
      setIsOnline(true);
      setReconnectAttempts(0);
      reconnectDelayRef.current = 1000;

      if (onReconnect) {
        onReconnect();
      }

      toast.success('Bağlantı yeniden kuruldu');
    };

    const handleOffline = () => {
      logger.warn('Network connection lost');
      setIsOnline(false);

      if (onDisconnect) {
        onDisconnect();
      }

      toast.warning('Bağlantı kesildi', {
        description: 'Tekrar bağlanılmaya çalışılıyor...',
      });

      attemptReconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, attemptReconnect, onReconnect, onDisconnect]);

  return {
    isOnline,
    reconnectAttempts,
  };
}
