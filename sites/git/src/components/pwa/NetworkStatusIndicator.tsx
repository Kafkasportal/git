/**
 * Network Status Indicator
 * Shows visual feedback for online/offline status
 */

'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOfflineStats } from '@/lib/offline-sync';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showIndicator, setShowIndicator] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const stats = await getOfflineStats();
        setPendingCount(stats.pendingCount);
      } catch (_error) {
        // Ignore errors
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      setShowIndicator(true);

      // Load pending count to show sync status
      await loadPendingCount();

      // Hide after 3 seconds
      setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };

    const handleOffline = async () => {
      setIsOnline(false);
      setShowIndicator(true);
      // Load pending count when going offline
      await loadPendingCount();
      // Don't auto-hide offline status
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial pending count
    if (!isOnline) {
      loadPendingCount();
    }

    // Refresh pending count every 10 seconds when offline
    const interval = setInterval(() => {
      if (!isOnline) {
        loadPendingCount();
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Don't show anything if online and indicator is hidden
  if (isOnline && !showIndicator) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300',
        'backdrop-blur-sm border',
        isOnline
          ? 'bg-green-50/90 dark:bg-green-900/30 border-green-200 dark:border-green-800'
          : 'bg-red-50/90 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        showIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Bağlantı yeniden kuruldu
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            İnternet bağlantısı yok
            {pendingCount > 0 && ` (${pendingCount} işlem bekliyor)`}
          </span>
        </>
      )}
    </div>
  );
}
