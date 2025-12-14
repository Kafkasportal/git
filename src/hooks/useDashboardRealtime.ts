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

    // Handle realtime messages
    const handleMessage = useCallback((response: RealtimeResponseEvent<unknown>) => {
        const events = response.events || [];

        // Determine which collection was updated
        let collectionId = '';
        let eventType = '';

        for (const event of events) {
            const match = event.match(/collections\.(\w+)\.documents\.(\w+)$/);
            if (match) {
                collectionId = match[1];
                eventType = match[2]; // create, update, delete
                break;
            }
        }

        if (!collectionId) return;

        // Invalidate relevant queries based on collection
        switch (collectionId) {
            case 'beneficiaries':
                queryClient.invalidateQueries({ queryKey: ['monitoring', 'stats'] });
                queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
                break;
            case 'donations':
                queryClient.invalidateQueries({ queryKey: ['monitoring', 'stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'charts'] });
                queryClient.invalidateQueries({ queryKey: ['donations'] });
                break;
            case 'tasks':
                queryClient.invalidateQueries({ queryKey: ['monitoring', 'kpis'] });
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                break;
            case 'meetings':
                queryClient.invalidateQueries({ queryKey: ['monitoring', 'kpis'] });
                queryClient.invalidateQueries({ queryKey: ['meetings'] });
                break;
            case 'notifications':
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                break;
            default:
                // Generic invalidation
                queryClient.invalidateQueries({ queryKey: [collectionId] });
        }

        // Show notification if enabled
        if (showNotifications && eventType) {
            const label = COLLECTION_LABELS[collectionId] || collectionId;
            const action = eventType === 'create' ? 'eklendi' :
                eventType === 'update' ? 'güncellendi' :
                    eventType === 'delete' ? 'silindi' : 'değişti';

            toast.info(`${label} ${action}`, {
                description: 'Dashboard otomatik güncellendi',
                duration: 3000,
            });
        }
    }, [queryClient, showNotifications]);

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
