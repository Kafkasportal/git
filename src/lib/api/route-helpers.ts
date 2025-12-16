/**
 * Shared utilities for API route handlers
 * Reduces code duplication across API routes
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

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
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  // 204 No Content must not include a response body
  if (status === 204) {
    return new NextResponse(null, { status }) as unknown as NextResponse<
      ApiResponse<T>
    >;
  }

  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status },
  );
}

/**
 * Create an error response
 */
export function errorResponse<T = never>(
  error: string,
  status: number = 400,
  details?: string[],
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status },
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
  resourceName: string = "Kayıt",
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    if (!id) {
      return errorResponse<T>("ID parametresi gerekli", 400);
    }

    const response = await getOperation(id);

    if (response.error || !response.data) {
      return errorResponse<T>(`${resourceName} bulunamadı`, 404);
    }

    return successResponse(response.data as T);
  } catch (_error: unknown) {
    logger.error(`Get ${resourceName} error`, { error: _error });
    return errorResponse<T>("Veri alınamadı", 500);
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
  resourceName: string = "Kayıt",
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    if (!id) {
      return errorResponse<T>("ID parametresi gerekli", 400);
    }

    const validation = validate(body);
    if (!validation.isValid) {
      return errorResponse<T>("Doğrulama hatası", 400, validation.errors);
    }

    const response = await updateOperation(id, body);

    if (response.error || !response.data) {
      return errorResponse<T>(response.error || "Güncelleme başarısız", 400);
    }

    return successResponse(response.data as T, `${resourceName} güncellendi`);
  } catch (error: unknown) {
    logger.error(`Update ${resourceName} error`, { error });
    return errorResponse<T>("Güncelleme işlemi başarısız", 500);
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
  resourceName: string = "Kayıt",
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    if (!id) {
      return errorResponse<null>("ID parametresi gerekli", 400);
    }

    const response = await deleteOperation(id);

    if (response.error) {
      return errorResponse<null>(response.error, 400);
    }

    return successResponse(null, `${resourceName} silindi`);
  } catch (error: unknown) {
    logger.error(`Delete ${resourceName} error`, { error });
    return errorResponse<null>("Silme işlemi başarısız", 500);
  }
}

/**
 * Extract and await params from Next.js 15 async params
 */
export async function extractParams<T extends Record<string, string>>(
  params: Promise<T>,
): Promise<T> {
  return await params;
}

/**
 * Parse JSON body with error handling
 */
export async function parseBody<T = unknown>(
  request: NextRequest,
): Promise<{ data?: T; error?: string }> {
  try {
    const body = await request.json();
    return { data: body };
  } catch (_error) {
    return { error: "Geçersiz istek verisi" };
  }
}

/**
 * Handle duplicate key errors (e.g., duplicate TC number)
 */
export function handleDuplicateError(
  error: unknown,
  duplicateKey: string = "TC Kimlik No",
  defaultMessage: string = "Bu kayıt zaten mevcut",
): { isDuplicate: boolean; message: string } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isDuplicate =
    errorMessage?.toLowerCase().includes("duplicate") ||
    errorMessage?.toLowerCase().includes("unique") ||
    errorMessage?.toLowerCase().includes("already exists");

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
  logger: {
    error: (
      message: string,
      error: unknown,
      context?: Record<string, unknown>,
    ) => void;
  },
  context: {
    endpoint: string;
    method: string;
    [key: string]: unknown;
  },
  defaultMessage: string = "İşlem başarısız",
): Promise<NextResponse<ApiResponse<T>>> {
  logger.error("API error", error, context);

  // Handle duplicate errors
  const duplicateCheck = handleDuplicateError(error);
  if (duplicateCheck.isDuplicate) {
    return errorResponse<T>(duplicateCheck.message, 409);
  }

  return errorResponse<T>(defaultMessage, 500);
}
