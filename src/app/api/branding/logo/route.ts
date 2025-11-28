/**
 * POST /api/branding/logo
 * Upload and update organization logos
 * Supports: main_logo, logo_dark, favicon, email_logo
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { mutationRateLimit } from '@/lib/rate-limit';
import { appwriteStorage, appwriteSystemSettings } from '@/lib/appwrite/api';
import { appwriteConfig } from '@/lib/appwrite/config';
import { ID } from 'appwrite';
import logger from '@/lib/logger';

async function uploadLogoHandler(request: NextRequest) {
  try {
    // Require authentication - only admins can upload logos
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Logo yüklemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const logoType = formData.get('logoType') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dosya bulunamadı',
        },
        { status: 400 }
      );
    }

    if (!logoType || !['main_logo', 'logo_dark', 'favicon', 'email_logo'].includes(logoType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz logo türü',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sadece PNG, JPG, WEBP ve SVG formatları destekleniyor',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dosya boyutu maksimum 5MB olabilir',
        },
        { status: 400 }
      );
    }

    // Upload to Appwrite Storage
    const storage = appwriteStorage;
    const bucketId = appwriteConfig.buckets.avatars; // Use avatars bucket for logos
    const fileId = ID.unique();
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadedFile = await storage.uploadFile(
      bucketId,
      fileId,
      buffer,
      ['read("any")'] // Public read
    );

    const storageId = uploadedFile.$id;
    const url = storage.getFileView(bucketId, storageId);

    // Update logo URL in system_settings
    await appwriteSystemSettings.updateSetting(
      'branding',
      logoType,
      { url, storageId, fileName: file.name, fileType: file.type },
      user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Logo başarıyla yüklendi',
      data: {
        logoType,
        url,
        storageId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Logo yüklenemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = mutationRateLimit(uploadLogoHandler);

/**
 * DELETE /api/branding/logo
 * Remove a logo
 */
async function deleteLogoHandler(request: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();

    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Logo silmek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const logoType = searchParams.get('logoType');

    if (!logoType || !['main_logo', 'logo_dark', 'favicon', 'email_logo'].includes(logoType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz logo türü',
        },
        { status: 400 }
      );
    }

    // Get logo setting to get storage ID
    const logoSetting = await appwriteSystemSettings.getSetting('branding', logoType);
    
    // Delete from storage if exists
    if (logoSetting?.value?.storageId) {
      const storage = appwriteStorage;
      const bucketId = appwriteConfig.buckets.avatars;
      try {
        await storage.deleteFile(bucketId, logoSetting.value.storageId);
      } catch (error) {
        // Log but don't fail if file doesn't exist
        logger.warn('Failed to delete logo file from storage', { error });
      }
    }

    // Remove logo setting from system_settings
    await appwriteSystemSettings.updateSetting('branding', logoType, null, user.id);
    const result = { success: true };

    return NextResponse.json(result);
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Logo silinemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const DELETE = mutationRateLimit(deleteLogoHandler);
