/**
 * GET /api/communication?type=email|sms|whatsapp
 * Get communication settings by type
 *
 * GET /api/communication (no type)
 * Get all communication settings
 *
 * PUT /api/communication?type=email|sms|whatsapp
 * Update communication settings by type
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, mutationRateLimit } from '@/lib/rate-limit';
import { appwriteSystemSettings } from '@/lib/appwrite/api';

async function getCommunicationHandler(request: NextRequest) {
  try {
    // Require authentication - only admins can view communication settings
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'İletişim ayarlarını görüntülemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let settings;

    if (type) {
      // Get specific type
      if (!['email', 'sms', 'whatsapp'].includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Geçersiz iletişim türü (email, sms, whatsapp olmalı)',
          },
          { status: 400 }
        );
      }

      const setting = await appwriteSystemSettings.getSetting('communication', type);
      settings = setting?.value || {};
    } else {
      // Get all types
      const [email, sms, whatsapp] = await Promise.all([
        appwriteSystemSettings.getSetting('communication', 'email'),
        appwriteSystemSettings.getSetting('communication', 'sms'),
        appwriteSystemSettings.getSetting('communication', 'whatsapp'),
      ]);

      settings = {
        email: email?.value || {},
        sms: sms?.value || {},
        whatsapp: whatsapp?.value || {},
      };
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'İletişim ayarları alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getCommunicationHandler);

async function updateCommunicationHandler(request: NextRequest) {
  try {
    // Require authentication - only admins can update communication settings
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'İletişim ayarlarını güncellemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['email', 'sms', 'whatsapp'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz iletişim türü (email, sms, whatsapp olmalı)',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update communication settings in system_settings collection
    await appwriteSystemSettings.updateSetting('communication', type, body, user.id);
    const result = { success: true };

    return NextResponse.json({
      success: true,
      message: `${type.toUpperCase()} ayarları güncellendi`,
      data: result,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'İletişim ayarları güncellenemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const PUT = mutationRateLimit(updateCommunicationHandler);
