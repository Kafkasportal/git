import { NextRequest, NextResponse } from 'next/server';
import { appwriteFiles, appwriteStorage } from '@/lib/appwrite/api';
import { appwriteConfig } from '@/lib/appwrite/config';
import logger from '@/lib/logger';
import {
  requireAuthenticatedUser,
  verifyCsrfToken,
  buildErrorResponse,
} from '@/lib/api/auth-utils';

/**
 * GET /api/storage/[fileId]
 * Retrieve a file from storage
 * Requires authentication - prevents unauthorized file access
 *
 * SECURITY CRITICAL: File access without auth = data leak vulnerability
 */
async function getFileHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Require authentication - prevent unauthorized file access
    await requireAuthenticatedUser();

    const { fileId } = await params;

    // Get file metadata from files collection
    const file = await appwriteFiles.getByStorageId(fileId);

    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı' }, { status: 404 });
    }

    // Get bucket ID
    const bucket = (file.bucket as string) || 'documents';
    const bucketId = appwriteConfig.buckets[bucket as keyof typeof appwriteConfig.buckets] || bucket;

    // Generate file view URL from Appwrite storage
    const fileUrl = appwriteStorage.getFileView(bucketId, fileId);

    return NextResponse.redirect(fileUrl);
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('File retrieval error', error);
    return NextResponse.json({ success: false, error: 'Dosya alınamadı' }, { status: 500 });
  }
}

/**
 * DELETE /api/storage/[fileId]
 * Delete a file from storage
 * Requires authentication and CSRF token - prevents unauthorized file deletion
 *
 * SECURITY CRITICAL: File deletion without auth = data loss vulnerability
 */
async function deleteFileHandler(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Verify CSRF token for destructive operations
    await verifyCsrfToken(request);

    // Require authentication - prevent unauthorized file deletion
    await requireAuthenticatedUser();

    const { fileId } = await params;

    // Get file metadata to find bucket
    const file = await appwriteFiles.getByStorageId(fileId);

    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı' }, { status: 404 });
    }

    // Get bucket ID
    const bucket = (file.bucket as string) || 'documents';
    const bucketId = appwriteConfig.buckets[bucket as keyof typeof appwriteConfig.buckets] || bucket;

    // Delete file from Appwrite storage
    await appwriteStorage.deleteFile(bucketId, fileId);

    // Delete file metadata from files collection
    if (file.$id || file._id) {
      await appwriteFiles.remove(file.$id || file._id || '');
    }

    return NextResponse.json({ success: true, message: 'Dosya başarıyla silindi' });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('File deletion error', error);
    return NextResponse.json({ success: false, error: 'Dosya silinemedi' }, { status: 500 });
  }
}

// Export handlers with rate limiting
// Next.js 15 requires async params, so we wrap the handlers manually
export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  // Rate limiting can be added here if needed
  return getFileHandler(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  // Rate limiting can be added here if needed
  return deleteFileHandler(request, context);
}
