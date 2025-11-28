/**
 * GET /api/whatsapp/status
 * Get WhatsApp connection status
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppStatus } from '@/lib/services/whatsapp';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

async function getStatusHandler(_request: NextRequest) {
  try {
    // Require authentication - only admins can check WhatsApp status
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp durumunu görüntülemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const status = getWhatsAppStatus();

    return NextResponse.json({
      success: true,
      status,
      message: status.isReady
        ? 'WhatsApp bağlı ve mesaj göndermeye hazır'
        : status.isAuthenticated
          ? 'WhatsApp kimlik doğrulaması yapıldı, hazırlanıyor...'
          : 'WhatsApp bağlı değil. QR kod okutmanız gerekiyor.',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Durum bilgisi alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getStatusHandler);
