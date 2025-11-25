/**
 * GET /api/security
 * Get all security settings
 *
 * PUT /api/security?type=password|session|2fa|general
 * Update security settings by type
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, mutationRateLimit } from '@/lib/rate-limit';
import { appwriteSystemSettings } from '@/lib/appwrite/api';

async function getSecurityHandler(_request: NextRequest) {
  try {
    // Require authentication - only super admins can view security settings
    const { user } = await requireAuthenticatedUser();

    const isSuperAdmin = user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Güvenlik ayarlarını görüntülemek için super admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    // Get all security settings from system_settings collection
    const securitySettings = await appwriteSystemSettings.getByCategory('security');
    const settings = securitySettings || {};

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
        error: 'Güvenlik ayarları alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getSecurityHandler);

async function updateSecurityHandler(request: NextRequest) {
  try {
    // Require authentication - only super admins can update security settings
    const { user } = await requireAuthenticatedUser();

    const isSuperAdmin = user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Güvenlik ayarlarını güncellemek için super admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['password', 'session', '2fa', 'general'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz güvenlik türü (password, session, 2fa, general olmalı)',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update security settings in system_settings collection
    await appwriteSystemSettings.updateSetting('security', type, body, user.id);
    const result = { success: true };

    return NextResponse.json({
      success: true,
      message: `${type.toUpperCase()} güvenlik ayarları güncellendi`,
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
        error: 'Güvenlik ayarları güncellenemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const PUT = mutationRateLimit(updateSecurityHandler);
