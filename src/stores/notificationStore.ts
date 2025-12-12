import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'task'
  | 'meeting'
  | 'donation'
  | 'beneficiary'
  | 'message';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, unknown>;
  // Backward compatibility aliases
  body?: string;
  status?: 'unread' | 'read';
  category?: string;
  $id?: string;
  _id?: string;
  $createdAt?: string;
  created_at?: string;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  desktopEnabled: boolean;
  emailEnabled: boolean;
  categories: {
    tasks: boolean;
    meetings: boolean;
    donations: boolean;
    messages: boolean;
    system: boolean;
  };
}

interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  isOpen: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  deleteNotification: (id: string) => void; // Alias for removeNotification
  clearAll: () => void;
  setIsOpen: (isOpen: boolean) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  setNotifications: (notifications: Notification[]) => void; // For bulk updates
  
  // Computed
  unreadCount: () => number;
  getNotificationsByType: (type: NotificationType) => Notification[];
}

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  desktopEnabled: false,
  emailEnabled: true,
  categories: {
    tasks: true,
    meetings: true,
    donations: true,
    messages: true,
    system: true,
  },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      settings: defaultSettings,
      isOpen: false,

      addNotification: (notification) => {
        // Use crypto for unique ID generation
        const randomBytes = new Uint8Array(6);
        crypto.getRandomValues(randomBytes);
        const randomPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const id = `notif-${Date.now()}-${randomPart}`;
        const createdAt = new Date().toISOString();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt,
          read: false,
          // Backward compatibility
          body: notification.message,
          status: 'unread',
          category: notification.type,
          $id: id,
          _id: id,
          $createdAt: createdAt,
          created_at: createdAt,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
        }));

        // Play sound if enabled
        if (get().settings.soundEnabled) {
          playNotificationSound();
        }

        // Show desktop notification if enabled
        if (get().settings.desktopEnabled) {
          showDesktopNotification(newNotification);
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id && n.$id !== id && n._id !== id),
        }));
      },

      // Alias for removeNotification
      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id && n.$id !== id && n._id !== id),
        }));
      },

      // Set all notifications (for bulk updates from API)
      setNotifications: (notifications) => {
        const normalized = notifications.map((n) => ({
          ...n,
          id: n.id || n.$id || n._id || `notif-${Date.now()}`,
          createdAt: n.createdAt || n.$createdAt || n.created_at || new Date().toISOString(),
          read: n.read ?? (n.status === 'read'),
          message: n.message || n.body || '',
        }));
        set({ notifications: normalized });
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      setIsOpen: (isOpen) => {
        set({ isOpen });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      unreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Only persist last 50
        settings: state.settings,
      }),
    }
  )
);

// Utility functions
function playNotificationSound() {
  if (typeof window !== 'undefined') {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch {
      // Could not play notification sound - silently ignore
    }
  }
}

function showDesktopNotification(notification: Notification) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        tag: notification.id,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            tag: notification.id,
          });
        }
      });
    }
  }
}

// Helper to create notifications
export const createNotification = {
  info: (title: string, message: string, link?: string) => ({
    type: 'info' as const,
    title,
    message,
    link,
  }),
  success: (title: string, message: string, link?: string) => ({
    type: 'success' as const,
    title,
    message,
    link,
  }),
  warning: (title: string, message: string, link?: string) => ({
    type: 'warning' as const,
    title,
    message,
    link,
  }),
  error: (title: string, message: string, link?: string) => ({
    type: 'error' as const,
    title,
    message,
    link,
  }),
  task: (title: string, message: string, taskId?: string) => ({
    type: 'task' as const,
    title,
    message,
    link: taskId ? `/is/gorevler?task=${taskId}` : undefined,
    metadata: { taskId },
  }),
  meeting: (title: string, message: string, meetingId?: string) => ({
    type: 'meeting' as const,
    title,
    message,
    link: meetingId ? `/is/toplantilar?meeting=${meetingId}` : undefined,
    metadata: { meetingId },
  }),
  donation: (title: string, message: string, donationId?: string) => ({
    type: 'donation' as const,
    title,
    message,
    link: donationId ? `/bagis/liste?id=${donationId}` : undefined,
    metadata: { donationId },
  }),
};

export default useNotificationStore;
