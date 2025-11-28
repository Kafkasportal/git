import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import {
  requireAuthenticatedUser,
  verifyCsrfToken,
  buildErrorResponse,
} from '@/lib/api/auth-utils';
import { uploadRateLimit, readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';
import { ID } from 'appwrite';
import { appwriteStorage } from '@/lib/appwrite/api';
import { appwriteConfig } from '@/lib/appwrite/config';

/**
 * POST /api/upload
 * Generate upload URL for file upload
 * Requires authentication - prevents anonymous upload URL generation
 *
 * SECURITY CRITICAL: Upload URL generation without auth = file upload abuse
 */
async function postUploadHandler(_request: NextRequest) {
  try {
    // Require authentication - prevent anonymous upload URL generation
    await requireAuthenticatedUser();

    // Generate a unique file ID for the upload
    // Appwrite upload happens directly via the SDK or REST API
    const fileId = ID.unique();

    // Return the file ID that can be used for direct upload
    return NextResponse.json({
      success: true,
      fileId,
      message: 'Use this fileId with Appwrite SDK to upload the file',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error generating file ID:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Dosya yükleme için ID oluşturulamadı",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload?storageId=...
 * Get file download URL
 * Requires authentication - prevents unauthorized file access
 *
 * SECURITY CRITICAL: File URL access without auth = data leak
 */
async function getUploadHandler(request: NextRequest) {
  try {
    // Require authentication - prevent unauthorized file URL access
    await requireAuthenticatedUser();

    const url = new URL(request.url);
    const storageId = url.searchParams.get('storageId');

    if (!storageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Storage ID gerekli',
        },
        { status: 400 }
      );
    }

    // Get download URL from Appwrite Storage
    const bucketId = appwriteConfig.buckets.documents;
    const downloadUrl = appwriteStorage.getFileView(bucketId, storageId);

    return NextResponse.json({
      success: true,
      url: downloadUrl.toString(),
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error getting download URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Dosya URL'si alınamadı",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload?storageId=...
 * Delete file
 * Requires authentication and CSRF token - prevents unauthorized file deletion
 *
 * SECURITY CRITICAL: File deletion without auth = data loss
 */
async function deleteUploadHandler(request: NextRequest) {
  try {
    // Verify CSRF token for destructive operations
    await verifyCsrfToken(request);

    // Require authentication - prevent unauthorized file deletion
    await requireAuthenticatedUser();

    const url = new URL(request.url);
    const storageId = url.searchParams.get('storageId');

    if (!storageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Storage ID gerekli',
        },
        { status: 400 }
      );
    }

    // Delete file from Appwrite Storage
    const bucketId = appwriteConfig.buckets.documents;
    await appwriteStorage.deleteFile(bucketId, storageId);

    return NextResponse.json({
      success: true,
      message: 'Dosya başarıyla silindi',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error deleting file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Dosya silinemedi',
      },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const POST = uploadRateLimit(postUploadHandler);
export const GET = readOnlyRateLimit(getUploadHandler);
export const DELETE = dataModificationRateLimit(deleteUploadHandler);
