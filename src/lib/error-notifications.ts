/**
 * Error Notification Integration
 * Automatically create notifications for critical/high severity errors
 */

import { createLogger } from '@/lib/logger';
import { appwriteUsers, appwriteWorkflowNotifications } from '@/lib/appwrite/api';

const logger = createLogger('error-notifications');

export interface ErrorNotificationOptions {
  errorId: string;
  errorCode: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  component?: string;
  url?: string;
}

/**
 * Create notification for error
 * Sends to admins for critical/high severity errors
 */
export async function createErrorNotification(options: ErrorNotificationOptions): Promise<void> {
  const { errorId, errorCode, title, severity, category, component, url } = options;

  // Only create notifications for critical and high severity
  if (severity !== 'critical' && severity !== 'high') {
    return;
  }

  try {
    // Get all admin and super admin users
    const adminUsersResult = await appwriteUsers.list({
      filters: [{ field: 'role', value: 'admin' }, { field: 'isActive', value: true }],
    });

    const superAdminUsersResult = await appwriteUsers.list({
      filters: [{ field: 'role', value: 'super_admin' }, { field: 'isActive', value: true }],
    });

    const allAdmins = [
      ...(adminUsersResult.documents || []),
      ...(superAdminUsersResult.documents || []),
    ];

    if (allAdmins.length === 0) {
      logger.warn('No admin users found to notify', { errorId });
      return;
    }

    const severityEmoji = severity === 'critical' ? '🚨' : '⚠️';
    const categoryLabel = getCategoryLabel(category);

    const notificationTitle = `${severityEmoji} ${
      severity === 'critical' ? 'KRİTİK HATA' : 'YÜKSEK ÖNCELİKLİ HATA'
    }`;

    const notificationBody = `
Hata: ${title}
Kategori: ${categoryLabel}
Kod: ${errorCode}
${component ? `Bileşen: ${component}` : ''}
${url ? `URL: ${url}` : ''}

Lütfen ${severity === 'critical' ? 'acilen' : ''} kontrol edin.
    `.trim();

    // Create notification for each admin user
    const notificationPromises = allAdmins.map(async (admin) => {
      try {
        const notificationId = await appwriteWorkflowNotifications.create({
          recipient: admin.$id,
          category: 'hatirlatma',
          title: notificationTitle,
          body: notificationBody,
          status: 'beklemede',
          reference: {
            type: 'error' as any, // Error type not in current schema, using 'hatirlatma' instead
            id: errorId,
          },
          metadata: {
            error_severity: severity,
            error_category: category,
            error_code: errorCode,
            priority: severity === 'critical' ? 'urgent' : 'high',
          },
        });

        logger.info('Error notification created', {
          notificationId,
          recipient: admin.$id,
          errorId,
        });

        return notificationId;
      } catch (err) {
        logger.error('Failed to create notification for admin', err, {
          adminId: admin.$id,
          errorId,
        });
        return null;
      }
    });

    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

    logger.info('Error notifications created', {
      errorId,
      totalAdmins: allAdmins.length,
      successCount,
    });
  } catch (error) {
    logger.error('Failed to create error notification', error, {
      errorId,
      severity,
    });
  }
}

/**
 * Get human-readable category label
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    runtime: 'Çalışma Zamanı',
    ui_ux: 'UI/UX',
    design_bug: 'Tasarım Hatası',
    system: 'Sistem',
    data: 'Veri',
    security: 'Güvenlik',
    performance: 'Performans',
    integration: 'Entegrasyon',
  };

  return labels[category] || category;
}

/**
 * Send email notification for critical errors
 * (Placeholder - would integrate with email service)
 */
export async function sendCriticalErrorEmail(options: ErrorNotificationOptions): Promise<void> {
  if (options.severity !== 'critical') {
    return;
  }

  logger.info('Critical error email would be sent', {
    errorId: options.errorId,
    title: options.title,
  });

  // Email template integration ready
  // To enable: Import EmailTemplates and configure SMTP provider
  // Example implementation:
  // import { EmailTemplates } from '@/lib/email-templates';
  // const emailData = EmailTemplates.errorNotification({
  //   errorCode: options.errorId || 'UNKNOWN',
  //   errorMessage: options.title,
  //   stackTrace: options.stackTrace,
  //   timestamp: new Date().toISOString(),
  //   severity: options.severity,
  // });
  // await sendEmail(adminEmails, emailData.subject, emailData.html);
}
