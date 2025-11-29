import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkflowNotificationDocument } from '@/types/database';

interface NotificationState {
  notifications: WorkflowNotificationDocument[];
  unreadCount: number;
  addNotification: (notification: WorkflowNotificationDocument) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setNotifications: (notifications: WorkflowNotificationDocument[]) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        set((state) => {
          // Check if notification already exists
          const exists = state.notifications.some(
            (n) => (n.$id || n._id) === (notification.$id || notification._id)
          );
          if (exists) {
            return state;
          }

          const newNotifications = [notification, ...state.notifications];
          const unreadCount = newNotifications.filter(
            (n) => n.status !== 'okundu'
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) => {
            const notificationId = n.$id || n._id;
            if (notificationId === id) {
              return { ...n, status: 'okundu' as const, read_at: new Date().toISOString() };
            }
            return n;
          });

          const unreadCount = updatedNotifications.filter(
            (n) => n.status !== 'okundu'
          ).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) => ({
            ...n,
            status: 'okundu' as const,
            read_at: n.read_at || new Date().toISOString(),
          }));

          return {
            notifications: updatedNotifications,
            unreadCount: 0,
          };
        });
      },

      deleteNotification: (id) => {
        set((state) => {
          const filteredNotifications = state.notifications.filter(
            (n) => (n.$id || n._id) !== id
          );
          const unreadCount = filteredNotifications.filter(
            (n) => n.status !== 'okundu'
          ).length;

          return {
            notifications: filteredNotifications,
            unreadCount,
          };
        });
      },

      setNotifications: (notifications) => {
        set(() => {
          const unreadCount = notifications.filter(
            (n) => n.status !== 'okundu'
          ).length;

          return {
            notifications,
            unreadCount,
          };
        });
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 100), // Store only last 100 notifications
        unreadCount: state.unreadCount,
      }),
    }
  )
);

