/**
 * GET /api/whatsapp/qr
 * Get WhatsApp QR code for authentication
 * Returns QR code data or null if already authenticated
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQRCode, getWhatsAppStatus } from '@/lib/services/whatsapp';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

async function getQRCodeHandler(_request: NextRequest) {
  try {
    // Require authentication - only admins can access WhatsApp
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp QR kodunu görüntülemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const qrCode = getQRCode();
    const status = getWhatsAppStatus();

    if (status.isReady) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp zaten bağlı',
        qrCode: null,
        status,
      });
    }

    if (!qrCode) {
      return NextResponse.json({
        success: false,
        message:
          "QR kod henüz oluşturulmadı. Lütfen önce /api/whatsapp/initialize endpoint'ini çağırın.",
        qrCode: null,
        status,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'QR kodu telefonunuzla okutun',
      qrCode,
      status,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'QR kod alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getQRCodeHandler);
