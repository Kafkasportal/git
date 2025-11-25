/**
 * Real-time Query Hooks
 *
 * ✅ MIGRATED TO APPWRITE REALTIME
 *
 * These hooks now use Appwrite Realtime API for real-time data synchronization.
 * For new code, prefer using the hooks from @/hooks/useAppwriteRealtime directly.
 *
 * @see src/hooks/useAppwriteRealtime.ts for full Appwrite Realtime implementation
 */

import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useAppwriteDocument,
  useAppwriteCollection,
} from '@/hooks/useAppwriteRealtime';

interface RealtimeQueryOptions {
  /** Database ID */
  databaseId: string;
  /** Collection ID */
  collectionId: string;
  /** Document ID (for single document queries) */
  documentId?: string;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Show a toast notification when data changes */
  notifyOnChange?: boolean;
  /** Custom notification message */
  changeMessage?: string;
  /** Disable notification for first load */
  skipInitial?: boolean;
  /** Custom onChange callback */
  onChange?: (newData: unknown, oldData: unknown) => void;
}

/**
 * Enhanced real-time query hook with Appwrite Realtime
 * Subscribe to a single document with real-time updates
 *
 * @example
 * ```ts
 * const data = useRealtimeQuery({
 *   databaseId: 'main',
 *   collectionId: 'users',
 *   documentId: userId,
 *   notifyOnChange: true,
 * });
 * ```
 */
export function useRealtimeQuery<T = unknown>(
  options: RealtimeQueryOptions
): T | undefined {
  const {
    databaseId,
    collectionId,
    documentId,
    enabled = true,
    notifyOnChange = false,
    changeMessage,
    skipInitial = true,
    onChange,
  } = options;

  const previousDataRef = useRef<T | null>(null);

  // Use Appwrite Realtime for single document
  const { data } = useAppwriteDocument<T>({
    databaseId,
    collectionId,
    documentId: documentId || '',
    enabled: enabled && Boolean(documentId),
    notifyOnChange,
    changeMessage,
    skipInitial,
    onChange: (event) => {
      const newData = event.payload as T;
      if (onChange) {
        onChange(newData, previousDataRef.current);
      }
      previousDataRef.current = newData;
    },
  });

  return data || undefined;
}

/**
 * Hook for monitoring real-time list updates with detailed notifications
 * Subscribe to a collection with real-time updates
 *
 * @example
 * ```ts
 * const items = useRealtimeList({
 *   databaseId: 'main',
 *   collectionId: 'tasks',
 *   itemName: 'görev',
 *   notifyOnChange: true,
 * });
 * ```
 */
export function useRealtimeList<T = unknown>(
  options: Omit<RealtimeQueryOptions, 'documentId'> & {
    itemName?: string;
  }
): T[] | undefined {
  const {
    databaseId,
    collectionId,
    enabled = true,
    notifyOnChange = false,
    skipInitial = true,
    itemName = 'kayıt',
  } = options;

  // Use Appwrite Realtime for collection
  const { documents } = useAppwriteCollection<T>({
    databaseId,
    collectionId,
    enabled,
    notifyOnChange,
    skipInitial,
    changeMessage: `${itemName} güncellendi`,
  });

  return documents.length > 0 ? documents : undefined;
}

/**
 * Hook for detecting conflicts when editing records
 * Shows warning if the record is being edited by another user
 */
export function useEditConflictDetection<T extends { _id: string; _updatedAt?: number }>(
  record: T | undefined | null,
  isEditing: boolean
): {
  hasConflict: boolean;
  conflictMessage: string | null;
} {
  const lastSeenTimestampRef = useRef<number | undefined>(undefined);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  useEffect(() => {
    // Handle state reset when record is cleared or editing stops
    if (!record || !isEditing) {
      if (hasConflict || conflictMessage) {
        Promise.resolve().then(() => {
          setHasConflict(false);
          setConflictMessage(null);
        });
      }
      return;
    }

    const currentTimestamp = record._updatedAt;

    // Initialize on first load
    if (lastSeenTimestampRef.current === undefined) {
      lastSeenTimestampRef.current = currentTimestamp;
      return;
    }

    // Detect if record was updated by someone else
    if (currentTimestamp && currentTimestamp > lastSeenTimestampRef.current) {
      // Defer state updates to avoid cascading renders
      Promise.resolve().then(() => {
        setHasConflict(true);
        setConflictMessage('Bu kayıt başka bir kullanıcı tarafından güncellendi!');

        toast.warning('⚠️ Dikkat: Bu kayıt başka biri tarafından değiştirildi', {
          description: 'Güncel verileri görmek için sayfayı yenileyin.',
          duration: 8000,
          action: {
            label: 'Yenile',
            onClick: () => window.location.reload(),
          },
        });
      });

      lastSeenTimestampRef.current = currentTimestamp;
    }
  }, [record, isEditing, hasConflict, conflictMessage]);

  return {
    hasConflict,
    conflictMessage,
  };
}

/**
 * Hook for showing presence indicators (who is online/editing)
 * This is a placeholder for future implementation with Appwrite Realtime
 */
export function usePresence(_resourceId: string, _userId?: string) {
  // Presence tracking requires Appwrite Realtime API implementation
  // See docs/ISSUES.md - Issue #4: Appwrite Realtime Migration
  return {
    activeUsers: [] as Array<{ id: string; name: string; cursor?: { x: number; y: number } }>,
    isUserActive: false,
  };
}
