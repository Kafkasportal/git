/**
 * POST /api/whatsapp/destroy
 * Destroy WhatsApp client and logout
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { destroyWhatsApp } from '@/lib/services/whatsapp';
import {
  requireAuthenticatedUser,
  verifyCsrfToken,
  buildErrorResponse,
} from '@/lib/api/auth-utils';
import { dataModificationRateLimit } from '@/lib/rate-limit';
import logger from '@/lib/logger';

async function destroyWhatsAppHandler(request: NextRequest) {
  try {
    // Require authentication - only admins can destroy WhatsApp client
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp bağlantısını kesmek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    // CSRF protection
    await verifyCsrfToken(request);

    // Destroy WhatsApp client
    await destroyWhatsApp();

    logger.info('WhatsApp client destroyed via API', {
      service: 'whatsapp',
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp bağlantısı kesildi ve oturum kapatıldı',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to destroy WhatsApp client', error, {
      service: 'whatsapp',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'WhatsApp bağlantısı kesilemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = dataModificationRateLimit(destroyWhatsAppHandler);
