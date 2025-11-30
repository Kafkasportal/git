import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import logger from '@/lib/logger';
import type { WorkflowNotificationDocument } from '@/types/database';

interface NotificationEvent {
  type: 'connected' | 'notification' | 'heartbeat' | 'error';
  data?: WorkflowNotificationDocument;
  message?: string;
  timestamp?: number;
}

/**
 * Custom hook for real-time notification streaming via SSE
 */
export function useNotificationStream(userId: string | undefined) {
  const { addNotification } = useNotificationStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const eventSource = new EventSource('/api/notifications/stream', {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          logger.info('SSE connection opened', { userId });
          reconnectAttempts.current = 0;
        };

        eventSource.onmessage = (event) => {
          if (!isMounted) return;

          try {
            const data: NotificationEvent = JSON.parse(event.data);

            switch (data.type) {
              case 'connected':
                logger.info('SSE connected', { userId });
                break;

              case 'notification':
                if (data.data) {
                  // Convert WorkflowNotificationDocument to Notification format
                  const notif = data.data;
                  addNotification({
                    type: (notif.category || 'info') as 'info' | 'success' | 'warning' | 'error' | 'task' | 'meeting' | 'donation' | 'beneficiary' | 'message',
                    title: notif.title || '',
                    message: notif.body || '',
                    body: notif.body,
                    status: notif.status === 'okundu' ? 'read' : 'unread',
                    category: notif.category,
                    $id: notif.$id,
                    _id: notif._id,
                    $createdAt: notif.$createdAt,
                    created_at: notif.created_at,
                  });
                }
                break;

              case 'heartbeat':
                // Heartbeat received, connection is alive
                break;

              case 'error':
                logger.error('SSE error', { message: data.message, userId });
                break;

              default:
                logger.warn('Unknown SSE event type', { type: data.type, userId });
            }
          } catch (error) {
            logger.error('Failed to parse SSE message', { error, userId });
          }
        };

        eventSource.onerror = (error) => {
          logger.error('SSE connection error', { error, userId });

          // Close the connection
          eventSource.close();

          // Attempt to reconnect
          if (isMounted && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
            reconnectAttempts.current++;

            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                connect();
              }
            }, delay);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            logger.error('Max reconnect attempts reached', { userId });
          }
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        logger.error('Failed to create EventSource', { error, userId });
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [userId, addNotification]);
}

