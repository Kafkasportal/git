/**
 * Shared utilities for API route handlers
 * Reduces code duplication across API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * Standard API response type
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  message?: string;
};

/**
 * Validation result type
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Generic API operation that returns data or error
 * Flexible to support both mock and real API responses
 */
export type ApiOperation<T = unknown> = {
  data?: T | null;
  error?: string | null;
  total?: number;
};

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: string[]
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Handle common GET by ID pattern
 * @param id - Resource ID
 * @param getOperation - Function that fetches the resource
 * @param resourceName - Name of resource for error messages (e.g., 'Kullanıcı', 'Görev')
 */
export async function handleGetById<T>(
  id: string | undefined,
  getOperation: (id: string) => Promise<ApiOperation<T>>,
  resourceName: string = 'Kayıt'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    if (!id) {
      return errorResponse('ID parametresi gerekli', 400) as any;
    }

    const response = await getOperation(id);

    if (response.error || !response.data) {
      return errorResponse(`${resourceName} bulunamadı`, 404) as any;
    }

    return successResponse(response.data as T);
  } catch (_error: unknown) {
    logger.error(`Get ${resourceName} error`, { error: _error });
    return errorResponse('Veri alınamadı', 500) as any;
  }
}

/**
 * Handle common UPDATE pattern
 * @param id - Resource ID
 * @param body - Update data
 * @param validate - Validation function
 * @param updateOperation - Function that updates the resource
 * @param resourceName - Name of resource for success message
 */
export async function handleUpdate<T, U = unknown>(
  id: string | undefined,
  body: U,
  validate: (data: U) => ValidationResult,
  updateOperation: (id: string, data: U) => Promise<ApiOperation<T>>,
  resourceName: string = 'Kayıt'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    if (!id) {
      return errorResponse('ID parametresi gerekli', 400) as any;
    }

    const validation = validate(body);
    if (!validation.isValid) {
      return errorResponse('Doğrulama hatası', 400, validation.errors) as any;
    }

    const response = await updateOperation(id, body);

    if (response.error || !response.data) {
      return errorResponse(response.error || 'Güncelleme başarısız', 400) as any;
    }

    return successResponse(response.data as T, `${resourceName} güncellendi`);
  } catch (error: unknown) {
    logger.error(`Update ${resourceName} error`, { error });
    return errorResponse('Güncelleme işlemi başarısız', 500) as any;
  }
}

/**
 * Handle common DELETE pattern
 * @param id - Resource ID
 * @param deleteOperation - Function that deletes the resource
 * @param resourceName - Name of resource for success message
 */
export async function handleDelete(
  id: string | undefined,
  deleteOperation: (id: string) => Promise<ApiOperation>,
  resourceName: string = 'Kayıt'
): Promise<NextResponse<ApiResponse>> {
  try {
    if (!id) {
      return errorResponse('ID parametresi gerekli', 400) as any;
    }

    const response = await deleteOperation(id);

    if (response.error) {
      return errorResponse(response.error, 400) as any;
    }

    return successResponse(null, `${resourceName} silindi`);
  } catch (error: unknown) {
    logger.error(`Delete ${resourceName} error`, { error });
    return errorResponse('Silme işlemi başarısız', 500) as any;
  }
}

/**
 * Extract and await params from Next.js 15 async params
 */
export async function extractParams<T extends Record<string, string>>(
  params: Promise<T>
): Promise<T> {
  return await params;
}

/**
 * Parse JSON body with error handling
 */
export async function parseBody<T = unknown>(
  request: NextRequest
): Promise<{ data?: T; error?: string }> {
  try {
    const body = await request.json();
    return { data: body };
  } catch (_error) {
    return { error: 'Geçersiz istek verisi' };
  }
}

/**
 * Handle duplicate key errors (e.g., duplicate TC number)
 */
export function handleDuplicateError(
  error: unknown,
  duplicateKey: string = 'TC Kimlik No',
  defaultMessage: string = 'Bu kayıt zaten mevcut'
): { isDuplicate: boolean; message: string } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isDuplicate =
    errorMessage?.toLowerCase().includes('duplicate') ||
    errorMessage?.toLowerCase().includes('unique') ||
    errorMessage?.toLowerCase().includes('already exists');

  return {
    isDuplicate,
    message: isDuplicate ? `${duplicateKey} zaten kayıtlı` : defaultMessage,
  };
}

/**
 * Standard error handler with logging
 */
export async function handleApiError<T>(
  error: unknown,
  logger: { error: (message: string, error: unknown, context?: Record<string, unknown>) => void },
  context: {
    endpoint: string;
    method: string;
    [key: string]: unknown;
  },
  defaultMessage: string = 'İşlem başarısız'
): Promise<NextResponse<ApiResponse<T>>> {
  logger.error('API error', error, context);

  // Handle duplicate errors
  const duplicateCheck = handleDuplicateError(error);
  if (duplicateCheck.isDuplicate) {
    return errorResponse(duplicateCheck.message, 409) as any;
  }

  return errorResponse(defaultMessage, 500) as any;
}
