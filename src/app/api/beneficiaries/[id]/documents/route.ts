import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { getDatabases } from '@/lib/appwrite/api/base';
import { appwriteConfig } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import type { RouteContext } from '@/lib/api/middleware';

// Document types
export enum DocumentType {
  KIMLIK = 'kimlik',
  IKAMET = 'ikamet',
  GELIR_BELGESI = 'gelir_belgesi',
  SAGLIK_RAPORU = 'saglik_raporu',
  OKUL_BELGESI = 'okul_belgesi',
  VEKALETNAME = 'vekaletname',
  BANKA_HESAP = 'banka_hesap',
  DIGER = 'diger',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.KIMLIK]: 'Kimlik Belgesi',
  [DocumentType.IKAMET]: 'İkamet Belgesi',
  [DocumentType.GELIR_BELGESI]: 'Gelir Belgesi',
  [DocumentType.SAGLIK_RAPORU]: 'Sağlık Raporu',
  [DocumentType.OKUL_BELGESI]: 'Okul Belgesi',
  [DocumentType.VEKALETNAME]: 'Vekaletname',
  [DocumentType.BANKA_HESAP]: 'Banka Hesap Belgesi',
  [DocumentType.DIGER]: 'Diğer',
};

/**
 * GET /api/beneficiaries/[id]/documents
 * Kayıt için belgeleri listeler
 */
export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (_request: NextRequest, context?: RouteContext) => {
  await requireAuthenticatedUser();

  const params = context?.params ? await context.params : {};
  const id = params.id as string;

  if (!id) {
    return errorResponse('Kayıt ID gereklidir', 400);
  }

  try {
    const databases = getDatabases();

    // Try to get documents from collection
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      'beneficiary_documents',
      [
        Query.equal('beneficiary_id', id),
        Query.orderDesc('$createdAt'),
      ]
    );

    const documents = result.documents.map((doc: Record<string, unknown>) => ({
      id: doc.$id,
      beneficiaryId: doc.beneficiary_id,
      type: doc.type,
      typeLabel: DOCUMENT_TYPE_LABELS[doc.type as DocumentType] || doc.type,
      name: doc.name,
      fileId: doc.file_id,
      fileUrl: doc.file_url,
      mimeType: doc.mime_type,
      size: doc.size,
      expiryDate: doc.expiry_date,
      isExpired: doc.expiry_date ? new Date(doc.expiry_date as string) < new Date() : false,
      isVerified: doc.is_verified || false,
      verifiedBy: doc.verified_by,
      verifiedAt: doc.verified_at,
      notes: doc.notes,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    // Calculate summary
    const summary = {
      total: documents.length,
      verified: documents.filter((d) => d.isVerified).length,
      expired: documents.filter((d) => d.isExpired).length,
      pending: documents.filter((d) => !d.isVerified && !d.isExpired).length,
    };

    return successResponse({
      documents,
      summary,
      documentTypes: Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    });
  } catch (_error) {
    // Collection might not exist
    return successResponse({
      documents: [],
      summary: { total: 0, verified: 0, expired: 0, pending: 0 },
      documentTypes: Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    });
  }
});

/**
 * POST /api/beneficiaries/[id]/documents
 * Yeni belge kaydı oluşturur
 */
export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 30, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  await verifyCsrfToken(request);
  const { user } = await requireAuthenticatedUser();

  const params = context?.params ? await context.params : {};
  const id = params.id as string;

  if (!id) {
    return errorResponse('Kayıt ID gereklidir', 400);
  }

  const { data, error } = await parseBody(request);

  if (error) {
    return errorResponse(error, 400);
  }

  const { type, name, fileId, fileUrl, mimeType, size, expiryDate, notes } = data as {
    type: DocumentType;
    name: string;
    fileId?: string;
    fileUrl?: string;
    mimeType?: string;
    size?: number;
    expiryDate?: string;
    notes?: string;
  };

  // Validation
  if (!type || !Object.values(DocumentType).includes(type)) {
    return errorResponse('Geçerli bir belge türü seçiniz', 400);
  }

  if (!name || name.trim().length < 2) {
    return errorResponse('Belge adı en az 2 karakter olmalıdır', 400);
  }

  try {
    const databases = getDatabases();

    const docData = {
      beneficiary_id: id,
      type,
      name: name.trim(),
      file_id: fileId,
      file_url: fileUrl,
      mime_type: mimeType,
      size,
      expiry_date: expiryDate,
      notes,
      is_verified: false,
      created_by: user.id,
    };

    const result = await databases.createDocument(
      appwriteConfig.databaseId,
      'beneficiary_documents',
      'unique()',
      docData
    );

    return successResponse({
      id: result.$id,
      ...docData,
      typeLabel: DOCUMENT_TYPE_LABELS[type],
      createdAt: result.$createdAt,
    }, 'Belge başarıyla eklendi');
  } catch (_error) {
    return errorResponse('Belge eklenirken bir hata oluştu', 500);
  }
});

/**
 * DELETE /api/beneficiaries/[id]/documents
 * Belge siler (body'de documentId gerekli)
 */
export const DELETE = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['DELETE'],
  rateLimit: { maxRequests: 20, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const params = context?.params ? await context.params : {};
  const id = params.id as string;

  if (!id) {
    return errorResponse('Kayıt ID gereklidir', 400);
  }

  const { data, error } = await parseBody(request);

  if (error) {
    return errorResponse(error, 400);
  }

  const { documentId } = data as { documentId: string };

  if (!documentId) {
    return errorResponse('Belge ID gereklidir', 400);
  }

  try {
    const databases = getDatabases();

    // Verify document belongs to this beneficiary
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      'beneficiary_documents',
      documentId
    );

    if (doc.beneficiary_id !== id) {
      return errorResponse('Bu belge bu kayıta ait değil', 403);
    }

    await databases.deleteDocument(
      appwriteConfig.databaseId,
      'beneficiary_documents',
      documentId
    );

    return successResponse({ deleted: documentId }, 'Belge başarıyla silindi');
  } catch (_error) {
    return errorResponse('Belge silinirken bir hata oluştu', 500);
  }
});

/**
 * PATCH /api/beneficiaries/[id]/documents
 * Belge doğrulama/güncelleme
 */
export const PATCH = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['PATCH'],
  rateLimit: { maxRequests: 30, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  await verifyCsrfToken(request);
  const { user } = await requireAuthenticatedUser();

  const params = context?.params ? await context.params : {};
  const id = params.id as string;

  if (!id) {
    return errorResponse('Kayıt ID gereklidir', 400);
  }

  const { data, error } = await parseBody(request);

  if (error) {
    return errorResponse(error, 400);
  }

  const { documentId, isVerified, expiryDate, notes } = data as {
    documentId: string;
    isVerified?: boolean;
    expiryDate?: string;
    notes?: string;
  };

  if (!documentId) {
    return errorResponse('Belge ID gereklidir', 400);
  }

  try {
    const databases = getDatabases();

    // Verify document belongs to this beneficiary
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      'beneficiary_documents',
      documentId
    );

    if (doc.beneficiary_id !== id) {
      return errorResponse('Bu belge bu kayıta ait değil', 403);
    }

    const updateData: Record<string, unknown> = {};

    if (isVerified !== undefined) {
      updateData.is_verified = isVerified;
      if (isVerified) {
        updateData.verified_by = user.id;
        updateData.verified_at = new Date().toISOString();
      }
    }

    if (expiryDate !== undefined) {
      updateData.expiry_date = expiryDate;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const result = await databases.updateDocument(
      appwriteConfig.databaseId,
      'beneficiary_documents',
      documentId,
      updateData
    );

    return successResponse({
      id: result.$id,
      isVerified: result.is_verified,
      verifiedBy: result.verified_by,
      verifiedAt: result.verified_at,
      expiryDate: result.expiry_date,
      notes: result.notes,
      updatedAt: result.$updatedAt,
    }, isVerified ? 'Belge doğrulandı' : 'Belge güncellendi');
  } catch (_error) {
    return errorResponse('Belge güncellenirken bir hata oluştu', 500);
  }
});
