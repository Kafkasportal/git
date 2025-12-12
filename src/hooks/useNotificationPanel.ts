'use client';

import { useCallback, useEffect } from 'react';
import { useNotificationStore, NotificationType, createNotification } from '@/stores/notificationStore';

export interface UseNotificationPanelOptions {
  /** Enable polling for new notifications */
  enablePolling?: boolean;
  /** Polling interval in ms */
  pollingInterval?: number;
  /** API endpoint for fetching notifications */
  endpoint?: string;
}

export function useNotificationPanel(options: UseNotificationPanelOptions = {}) {
  const {
    enablePolling = false,
    pollingInterval = 30000,
    endpoint = '/api/notifications',
  } = options;

  const {
    notifications,
    settings,
    isOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setIsOpen,
    updateSettings,
    unreadCount,
  } = useNotificationStore();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        // Add new notifications that don't exist
        data.notifications?.forEach((notif: { id: string; type: NotificationType; title: string; message: string; link?: string }) => {
          const exists = notifications.some((n) => n.id === notif.id);
          if (!exists) {
            addNotification({
              type: notif.type,
              title: notif.title,
              message: notif.message,
              link: notif.link,
            });
          }
        });
      }
    } catch {
      // Failed to fetch notifications - silently ignore
    }
  }, [endpoint, notifications, addNotification]);

  // Polling effect
  useEffect(() => {
    if (!enablePolling) return;

    // Initial fetch
    void fetchNotifications();

    // Set up polling
    const interval = setInterval(fetchNotifications, pollingInterval);

    return () => { clearInterval(interval); };
  }, [enablePolling, pollingInterval, fetchNotifications]);

  // Request desktop notification permission
  const requestDesktopPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateSettings({ desktopEnabled: true });
        return true;
      }
    }
    return false;
  }, [updateSettings]);

  // Create and add notification helpers
  const notify = {
    info: useCallback(
      (title: string, message: string, link?: string) => {
        addNotification(createNotification.info(title, message, link));
      },
      [addNotification]
    ),
    success: useCallback(
      (title: string, message: string, link?: string) => {
        addNotification(createNotification.success(title, message, link));
      },
      [addNotification]
    ),
    warning: useCallback(
      (title: string, message: string, link?: string) => {
        addNotification(createNotification.warning(title, message, link));
      },
      [addNotification]
    ),
    error: useCallback(
      (title: string, message: string, link?: string) => {
        addNotification(createNotification.error(title, message, link));
      },
      [addNotification]
    ),
    task: useCallback(
      (title: string, message: string, taskId?: string) => {
        addNotification(createNotification.task(title, message, taskId));
      },
      [addNotification]
    ),
    meeting: useCallback(
      (title: string, message: string, meetingId?: string) => {
        addNotification(createNotification.meeting(title, message, meetingId));
      },
      [addNotification]
    ),
    donation: useCallback(
      (title: string, message: string, donationId?: string) => {
        addNotification(createNotification.donation(title, message, donationId));
      },
      [addNotification]
    ),
  };

  return {
    // State
    notifications,
    settings,
    isOpen,
    unreadCount: unreadCount(),

    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setIsOpen,
    updateSettings,

    // Helpers
    notify,
    requestDesktopPermission,
    fetchNotifications,
  };
}

export default useNotificationPanel;

