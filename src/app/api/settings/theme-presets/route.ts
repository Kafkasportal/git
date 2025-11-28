/**
 * Theme Presets API Route
 * Handles CRUD operations for theme presets
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteThemePresets } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import {
  requireAuthenticatedUser,
  verifyCsrfToken,
  buildErrorResponse,
} from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';
import { themePresetSchema, type ThemePresetFormData } from '@/lib/validations/theme';
import type { ThemePreset } from '@/contexts/settings-context';

/**
 * GET - Get all theme presets
 * Requires authentication and settings:manage permission
 */
async function getThemePresetsHandler(_request: NextRequest) {
  try {
    // Require authentication with settings:manage permission
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('settings:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Fetch theme presets from Appwrite
    const presets = await appwriteThemePresets.list();

    // Parse and format theme presets
    const formattedPresets: ThemePreset[] = presets.map((preset: {
      $id?: string;
      _id?: string;
      name: string;
      description: string;
      theme_config?: string | Record<string, unknown>;
      is_default?: boolean;
      is_custom?: boolean;
    }) => {
      // Parse theme_config JSON string
      let themeConfig: Record<string, unknown> = {};
      try {
        themeConfig = typeof preset.theme_config === 'string' 
          ? JSON.parse(preset.theme_config) 
          : preset.theme_config || {};
      } catch (error) {
        logger.error('Failed to parse theme_config', { error, preset });
        themeConfig = {};
      }

      return {
        _id: preset.$id || preset._id,
        name: preset.name,
        description: preset.description,
        colors: themeConfig.colors || {},
        typography: themeConfig.typography,
        layout: themeConfig.layout,
        isDefault: preset.is_default === true,
        isCustom: preset.is_custom === true,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPresets,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Theme presets GET error', error);
    return NextResponse.json(
      { success: false, error: 'Tema ayarları alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new theme preset
 * Requires authentication, CSRF token, and settings:manage permission
 */
async function createThemePresetHandler(request: NextRequest) {
  try {
    // Verify CSRF token
    await verifyCsrfToken(request);

    // Require authentication with settings:manage permission
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('settings:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = themePresetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz veri',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data: ThemePresetFormData = validationResult.data;

    // If setting as default, update all other presets to is_default: false
    if (data.isDefault) {
      const allPresets = await appwriteThemePresets.list();
      for (const preset of allPresets) {
        if (preset.is_default === true) {
          await appwriteThemePresets.update(preset.$id || preset._id, {
            is_default: false,
          });
        }
      }
    }

    // Serialize theme data to JSON
    const themeConfig = {
      colors: data.colors,
      typography: data.typography,
      layout: data.layout,
    };

    // Map UI fields to database format
    const createData = {
      name: data.name,
      description: data.description || '',
      theme_config: JSON.stringify(themeConfig),
      is_default: data.isDefault || false,
      is_custom: data.isCustom || false,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    // Create theme preset
    const newPreset = await appwriteThemePresets.create(createData) as {
      $id?: string;
      _id?: string;
      name: string;
      description: string;
      theme_config?: string | Record<string, unknown>;
      is_default?: boolean;
      is_custom?: boolean;
    };

    // Format response
    let themeConfigParsed: Record<string, unknown> = {};
    try {
      themeConfigParsed = typeof newPreset.theme_config === 'string'
        ? JSON.parse(newPreset.theme_config)
        : newPreset.theme_config || {};
    } catch (error) {
      logger.error('Failed to parse created theme_config', { error });
    }

    const formattedPreset: ThemePreset = {
      _id: newPreset.$id || newPreset._id || '',
      name: newPreset.name,
      description: newPreset.description,
      colors: themeConfigParsed.colors || {},
      typography: themeConfigParsed.typography,
      layout: themeConfigParsed.layout,
      isDefault: newPreset.is_default === true,
      isCustom: newPreset.is_custom === true,
    };

    return NextResponse.json(
      {
        success: true,
        data: formattedPreset,
        message: 'Tema başarıyla oluşturuldu',
      },
      { status: 201 }
    );
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Theme preset POST error', error);
    return NextResponse.json(
      { success: false, error: 'Tema oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update theme preset
 * Requires authentication, CSRF token, and settings:manage permission
 */
async function updateThemePresetHandler(request: NextRequest) {
  try {
    // Verify CSRF token
    await verifyCsrfToken(request);

    // Require authentication with settings:manage permission
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('settings:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, data: updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tema ID gerekli' },
        { status: 400 }
      );
    }

    // Validate request data
    const validationResult = themePresetSchema.safeParse(updateData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz veri',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedData: ThemePresetFormData = validationResult.data;

    // If setting as default, update all other presets to is_default: false
    if (validatedData.isDefault) {
      const allPresets = await appwriteThemePresets.list();
      for (const preset of allPresets) {
        if (preset.is_default === true && (preset.$id || preset._id) !== id) {
          await appwriteThemePresets.update(preset.$id || preset._id, {
            is_default: false,
          });
        }
      }
    }

    // Serialize theme data to JSON
    const themeConfig = {
      colors: validatedData.colors,
      typography: validatedData.typography,
      layout: validatedData.layout,
    };

    // Map UI fields to database format
    const dbUpdateData = {
      name: validatedData.name,
      description: validatedData.description || '',
      theme_config: JSON.stringify(themeConfig),
      is_default: validatedData.isDefault || false,
      is_custom: validatedData.isCustom || false,
    };

    // Update theme preset
    await appwriteThemePresets.update(id, dbUpdateData);

    return NextResponse.json({
      success: true,
      message: 'Tema başarıyla güncellendi',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Theme preset PUT error', error);
    return NextResponse.json(
      { success: false, error: 'Tema güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete theme preset
 * Requires authentication, CSRF token, and settings:manage permission
 */
async function deleteThemePresetHandler(request: NextRequest) {
  try {
    // Verify CSRF token
    await verifyCsrfToken(request);

    // Require authentication with settings:manage permission
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('settings:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tema ID gerekli' },
        { status: 400 }
      );
    }

    // Check if the preset is the default
    const preset = await appwriteThemePresets.get(id) as { is_default?: boolean } | null;
    if (preset?.is_default === true) {
      return NextResponse.json(
        { success: false, error: 'Varsayılan tema silinemez' },
        { status: 400 }
      );
    }

    // Delete theme preset
    await appwriteThemePresets.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Tema başarıyla silindi',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Theme preset DELETE error', error);
    return NextResponse.json(
      { success: false, error: 'Tema silinirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getThemePresetsHandler);
export const POST = dataModificationRateLimit(createThemePresetHandler);
export const PUT = dataModificationRateLimit(updateThemePresetHandler);
export const DELETE = dataModificationRateLimit(deleteThemePresetHandler);

