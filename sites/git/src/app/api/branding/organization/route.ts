/**
 * GET /api/branding/organization
 * Get organization branding settings
 *
 * PUT /api/branding/organization
 * Update organization branding settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, mutationRateLimit } from '@/lib/rate-limit';
import { appwriteSystemSettings } from '@/lib/appwrite/api';

async function getOrganizationHandler(_request: NextRequest) {
  try {
    // Public endpoint - no auth required for reading branding
    // Get branding settings from system_settings collection
    const settings = await appwriteSystemSettings.getSetting('branding', 'organization');
    const branding = settings?.value || {};

    return NextResponse.json({
      success: true,
      data: branding,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Branding ayarları alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getOrganizationHandler);

async function updateOrganizationHandler(request: NextRequest) {
  try {
    // Require authentication - only admins can update branding
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Branding ayarlarını güncellemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const allowedFields = [
      'organizationName',
      'slogan',
      'footerText',
      'contactEmail',
      'contactPhone',
      'address',
      'website',
    ];

    const updates: Record<string, string> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Güncellenecek alan bulunamadı',
        },
        { status: 400 }
      );
    }

    // Update branding settings in system_settings collection
    await appwriteSystemSettings.updateSetting('branding', 'organization', updates, user.id);
    const result = { success: true };

    return NextResponse.json({
      success: true,
      message: 'Organizasyon bilgileri güncellendi',
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
        error: 'Organizasyon bilgileri güncellenemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const PUT = mutationRateLimit(updateOrganizationHandler);
