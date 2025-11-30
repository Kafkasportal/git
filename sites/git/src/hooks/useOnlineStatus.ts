/**
 * Online Status Hook
 * Centralized React hook for managing online/offline state across the application
 */

'use client';

import { useEffect, useState } from 'react';

interface UseOnlineStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
}

/**
 * Hook to track online/offline status
 * Uses navigator.onLine and listens to 'online'/'offline' events
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

