import { NextRequest, NextResponse } from 'next/server';
import { appwriteStorage, appwriteFiles } from '@/lib/appwrite/api';
import { appwriteConfig } from '@/lib/appwrite/config';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { uploadRateLimit } from '@/lib/rate-limit';
import { ID } from 'appwrite';
import logger from '@/lib/logger';

/**
 * POST /api/storage/upload
 * Upload files to Appwrite storage
 * Requires authentication - prevents file bomb attacks and unauthorized uploads
 *
 * SECURITY CRITICAL: File upload without auth = major vulnerability
 */
async function uploadFileHandler(request: NextRequest) {
  try {
    // Require authentication - prevent anonymous file uploads
    await requireAuthenticatedUser();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'documents';
    const beneficiaryId = formData.get('beneficiaryId') as string;
    const documentType = (formData.get('documentType') as string) || 'other';

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Dosya boyutu çok büyük. Maksimum 10MB olabilir.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya türü. Sadece resim ve PDF dosyaları kabul edilir.' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user } = await requireAuthenticatedUser();

    // Get bucket ID from config
    const bucketId = appwriteConfig.buckets[bucket as keyof typeof appwriteConfig.buckets] || bucket;

    // Generate unique file ID
    const fileId = ID.unique();

    // Upload file to Appwrite storage
    const storageFile = await appwriteStorage.uploadFile(
      bucketId,
      fileId,
      file,
      [`user:${user.id}`] // Set permissions
    );

    // Create document metadata in files collection
    if (beneficiaryId) {
      await appwriteFiles.create({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        storageId: storageFile.$id,
        beneficiaryId,
        documentType,
        uploadedBy: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: storageFile.$id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: appwriteStorage.getFileView(bucketId, storageFile.$id),
      },
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('File upload error', error, {
      endpoint: '/api/storage/upload',
      method: 'POST',
    });

    return NextResponse.json({ success: false, error: 'Dosya yükleme hatası' }, { status: 500 });
  }
}

// Export handler with upload rate limiting (10 uploads per minute)
export const POST = uploadRateLimit(uploadFileHandler);
