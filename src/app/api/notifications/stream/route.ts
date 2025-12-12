import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { appwriteWorkflowNotifications } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import type { WorkflowNotificationDocument } from '@/types/database';

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user } = await requireAuthenticatedUser();
    const userId = user.id;

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let lastCheckTime = Date.now();
        let isActive = true;

        // Send initial connection message
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

        // Polling function to check for new notifications
        const checkNotifications = async () => {
          if (!isActive) return;

          try {
            // Get notifications created after last check
            const response = await appwriteWorkflowNotifications.list({
              recipient: userId,
            });

            const notifications = (response.documents || []) as any as WorkflowNotificationDocument[];
            
            // Filter new notifications (created after last check)
            const newNotifications = notifications.filter((notif) => {
              const createdAt = notif.created_at || notif.$createdAt || '';
              const createdTime = new Date(createdAt).getTime();
              return createdTime > lastCheckTime;
            });

            // Send new notifications
            if (newNotifications.length > 0) {
              for (const notification of newNotifications) {
                const data = JSON.stringify({
                  type: 'notification',
                  data: notification,
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
              lastCheckTime = Date.now();
            }

            // Send heartbeat every 30 seconds
            const heartbeat = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() });
            controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
          } catch (error) {
            logger.error('SSE notification check error', { error, userId });
            const errorData = JSON.stringify({
              type: 'error',
              message: 'Bildirim kontrolü sırasında hata oluştu',
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }
        };

        // Initial check
        await checkNotifications();

        // Poll every 5 seconds
        const interval = setInterval(async () => {
          if (!isActive) {
            clearInterval(interval);
            return;
          }
          await checkNotifications();
        }, 5000);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          isActive = false;
          clearInterval(interval);
          controller.close();
          logger.info('SSE connection closed', { userId });
        });
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    logger.error('SSE endpoint error', { error });
    return new Response('Internal Server Error', { status: 500 });
  }
}

