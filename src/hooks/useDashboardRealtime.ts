'use client';

/**
 * useDashboardRealtime - Real-time dashboard updates
 * 
 * Subscribes to Appwrite collections and auto-invalidates React Query cache
 * when data changes are detected.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppwriteMultipleChannels } from '@/hooks/useAppwriteRealtime';
import { toast } from 'sonner';
import type { RealtimeResponseEvent } from 'appwrite';

interface UseDashboardRealtimeOptions {
    /** Enable/disable realtime updates */
    enabled?: boolean;
    /** Show toast on data updates */
    showNotifications?: boolean;
    /** Database ID */
    databaseId?: string;
}

interface UseDashboardRealtimeReturn {
    /** Whether connected to realtime */
    isConnected: boolean;
    /** Connection error if any */
    error: Error | null;
}

const COLLECTION_LABELS: Record<string, string> = {
    beneficiaries: 'İhtiyaç sahipleri',
    donations: 'Bağışlar',
    tasks: 'Görevler',
    meetings: 'Toplantılar',
    notifications: 'Bildirimler',
    users: 'Kullanıcılar',
};

export function useDashboardRealtime(
    options: UseDashboardRealtimeOptions = {}
): UseDashboardRealtimeReturn {
    const {
        enabled = true,
        showNotifications = false,
        databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'kafkasder',
    } = options;

    const queryClient = useQueryClient();

    // Define channels to subscribe to
    const channels = [
        `databases.${databaseId}.collections.beneficiaries.documents`,
        `databases.${databaseId}.collections.donations.documents`,
        `databases.${databaseId}.collections.tasks.documents`,
        `databases.${databaseId}.collections.meetings.documents`,
        `databases.${databaseId}.collections.notifications.documents`,
    ];

    // Extract collection ID and event type from realtime event
    const extractCollectionInfo = (events: string[]): { collectionId: string; eventType: string } | null => {
        const regex = /collections\.(\w+)\.documents\.(\w+)$/;
        for (const event of events) {
            const match = regex.exec(event);
            if (match) {
                return {
                    collectionId: match[1],
                    eventType: match[2], // create, update, delete
                };
            }
        }
        return null;
    };

    // Invalidate queries for specific collection
    const invalidateCollectionQueries = useCallback((collectionId: string) => {
        const invalidationMap: Record<string, string[][]> = {
            beneficiaries: [['monitoring', 'stats'], ['beneficiaries']],
            donations: [['monitoring', 'stats'], ['dashboard', 'charts'], ['donations']],
            tasks: [['monitoring', 'kpis'], ['tasks']],
            meetings: [['monitoring', 'kpis'], ['meetings']],
            notifications: [['notifications']],
        };

        const queryKeys = invalidationMap[collectionId];
        if (queryKeys) {
            queryKeys.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: key }).catch(() => {
                    // Ignore errors from query invalidation
                });
            });
        } else {
            // Generic invalidation
            queryClient.invalidateQueries({ queryKey: [collectionId] }).catch(() => {
                // Ignore errors from query invalidation
            });
        }
    }, [queryClient]);

    // Handle realtime messages
    const handleMessage = useCallback((response: RealtimeResponseEvent<unknown>) => {
        const events = response.events || [];
        const collectionInfo = extractCollectionInfo(events);

        if (!collectionInfo) return;

        invalidateCollectionQueries(collectionInfo.collectionId);

        // Show notification if enabled
        if (showNotifications && collectionInfo.eventType) {
            const label = COLLECTION_LABELS[collectionInfo.collectionId] || collectionInfo.collectionId;
            const getActionLabel = (type: string): string => {
                if (type === 'create') return 'eklendi';
                if (type === 'update') return 'güncellendi';
                if (type === 'delete') return 'silindi';
                return 'değişti';
            };
            const action = getActionLabel(collectionInfo.eventType);

            toast.info(`${label} ${action}`, {
                description: 'Dashboard otomatik güncellendi',
                duration: 3000,
            });
        }
    }, [queryClient, showNotifications, invalidateCollectionQueries]);

    // Use Appwrite realtime subscription
    const { isConnected, error } = useAppwriteMultipleChannels({
        channels,
        enabled,
        onMessage: handleMessage,
        onError: (err) => {
            console.error('Dashboard realtime error:', err);
        },
    });

    return {
        isConnected,
        error,
    };
}

export default useDashboardRealtime;
