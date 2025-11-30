'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';

/**
 * Offline Sync Indicator Component
 * Shows offline status and pending sync count
 */
export function OfflineSyncIndicator() {
  const { isOnline, isOffline } = useOnlineStatus();
  const { pendingCount, isSyncing, sync } = useOfflineSync({
    showNotifications: false,
  });

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg
        ${isOffline ? 'bg-yellow-500 text-yellow-950' : 'bg-blue-500 text-white'}
      `}
    >
      {isOffline ? (
        <>
          <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-950" />
          <span>Çevrimdışı</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-yellow-950/20 px-2 py-0.5 text-xs">
              {pendingCount} bekliyor
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Senkronize ediliyor...</span>
        </>
      ) : (
        <>
          <span>{pendingCount} bekleyen değişiklik</span>
          <button
            onClick={() => sync()}
            className="rounded-full bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
          >
            Senkronize Et
          </button>
        </>
      )}
    </div>
  );
}
