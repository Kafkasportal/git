/**
 * Default Theme Preset API Route
 * Handles fetching the default theme preset
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteThemePresets } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';
import type { ThemePreset } from '@/contexts/settings-context';

/**
 * GET - Get default theme preset
 * Requires authentication (all authenticated users can view default theme)
 */
async function getDefaultThemeHandler(_request: NextRequest) {
  try {
    // Require authentication (no special permission required)
    await requireAuthenticatedUser();

    // Fetch default theme preset
    const defaultPreset = await appwriteThemePresets.getDefault();

    if (!defaultPreset) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Parse theme_config JSON string
    let themeConfig: Record<string, unknown> = {};
    try {
      themeConfig = typeof defaultPreset.theme_config === 'string'
        ? JSON.parse(defaultPreset.theme_config)
        : defaultPreset.theme_config || {};
    } catch (error) {
      logger.error('Failed to parse default theme_config', { error });
      themeConfig = {};
    }

    // Format response
    const formattedPreset: ThemePreset = {
      _id: defaultPreset.$id || defaultPreset._id,
      name: defaultPreset.name,
      description: defaultPreset.description,
      colors: themeConfig.colors || {},
      typography: themeConfig.typography,
      layout: themeConfig.layout,
      isDefault: defaultPreset.is_default === true,
      isCustom: defaultPreset.is_custom === true,
    };

    return NextResponse.json({
      success: true,
      data: formattedPreset,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Default theme GET error', error);
    return NextResponse.json(
      { success: false, error: 'Varsayılan tema alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// Export handler with rate limiting
export const GET = readOnlyRateLimit(getDefaultThemeHandler);

