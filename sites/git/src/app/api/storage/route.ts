import { NextRequest, NextResponse } from 'next/server';
import { appwriteFiles } from '@/lib/appwrite/api';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';

/**
 * GET /api/storage
 * List files/documents
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get('beneficiaryId');
    const bucket = searchParams.get('bucket') || 'documents';
    const documentType = searchParams.get('documentType');

    const response = await appwriteFiles.list({
      beneficiaryId: beneficiaryId || undefined,
      bucket: bucket || undefined,
      documentType: documentType || undefined,
    });

    // Map documents to include URL
    const documents = response.documents.map((doc: { $id?: string; _id?: string; url?: string; storageId?: string; [key: string]: unknown }) => {
      const docId = doc.$id || doc._id || '';
      return {
        ...doc,
        _id: docId,
        url: doc.url || doc.storageId ? `/api/storage/${doc.storageId || docId}` : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: documents,
      total: response.total,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List files error', error);
    return NextResponse.json({ success: false, error: 'Dosyalar alınamadı' }, { status: 500 });
  }
}

