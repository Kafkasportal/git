/**
 * GET /api/settings/all
 * Get all system settings grouped by category
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';
import { appwriteSystemSettings } from '@/lib/appwrite/api';

async function getAllSettingsHandler(_request: NextRequest) {
  try {
    // Require authentication - only admins can access all settings
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sistem ayarlarını görüntülemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    // Fetch all settings from Appwrite
    const settings = await appwriteSystemSettings.getAll();

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
        error: 'Ayarlar alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getAllSettingsHandler);
