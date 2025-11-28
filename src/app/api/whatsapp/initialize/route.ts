/**
 * POST /api/whatsapp/initialize
 * Initialize WhatsApp client and start QR code authentication
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeWhatsApp, getWhatsAppStatus } from '@/lib/services/whatsapp';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { dataModificationRateLimit } from '@/lib/rate-limit';
import logger from '@/lib/logger';

async function initializeWhatsAppHandler(_request: NextRequest) {
  try {
    // Require authentication - only admins can initialize WhatsApp
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp başlatmak için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    // Check if already initialized
    const currentStatus = getWhatsAppStatus();
    if (currentStatus.isReady) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp client zaten başlatılmış ve hazır',
        status: currentStatus,
      });
    }

    // Initialize WhatsApp client
    await initializeWhatsApp();

    logger.info('WhatsApp client initialization requested', {
      service: 'whatsapp',
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message:
        "WhatsApp client başlatılıyor. QR kodu için /api/whatsapp/qr endpoint'ini kontrol edin.",
      status: getWhatsAppStatus(),
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to initialize WhatsApp client', error, {
      service: 'whatsapp',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'WhatsApp client başlatılamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = dataModificationRateLimit(initializeWhatsAppHandler);
