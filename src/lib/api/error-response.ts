/**
 * Standardized API Error Response Utilities
 * Provides consistent error formatting across all API endpoints
 */

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CSRF: 'INVALID_CSRF',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Business Logic
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code?: ErrorCode,
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Common error responses
 */
export const CommonErrors = {
  unauthorized: () =>
    createErrorResponse(
      'Yetkilendirme gerekli',
      ErrorCodes.UNAUTHORIZED
    ),

  forbidden: (reason?: string) =>
    createErrorResponse(
      reason || 'Bu işlem için yetkiniz bulunmuyor',
      ErrorCodes.FORBIDDEN
    ),

  notFound: (resource: string = 'Kayıt') =>
    createErrorResponse(
      `${resource} bulunamadı`,
      ErrorCodes.NOT_FOUND
    ),

  alreadyExists: (resource: string = 'Kayıt') =>
    createErrorResponse(
      `${resource} zaten mevcut`,
      ErrorCodes.ALREADY_EXISTS
    ),

  validationError: (message: string, details?: unknown) =>
    createErrorResponse(
      message,
      ErrorCodes.VALIDATION_ERROR,
      details
    ),

  invalidInput: (field?: string) =>
    createErrorResponse(
      field ? `Geçersiz ${field}` : 'Geçersiz veri',
      ErrorCodes.INVALID_INPUT
    ),

  internalError: (details?: unknown) =>
    createErrorResponse(
      'Bir hata oluştu',
      ErrorCodes.INTERNAL_ERROR,
      details
    ),

  csrfError: () =>
    createErrorResponse(
      'CSRF doğrulaması başarısız',
      ErrorCodes.INVALID_CSRF
    ),

  rateLimitExceeded: () =>
    createErrorResponse(
      'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin',
      ErrorCodes.RATE_LIMIT_EXCEEDED
    ),

  workflowError: (message: string) =>
    createErrorResponse(
      message,
      ErrorCodes.WORKFLOW_ERROR
    ),
} as const;

/**
 * Convert various error types to standardized API error response
 */
export function normalizeError(error: unknown, fallbackMessage?: string): ApiErrorResponse {
  // Already an ApiErrorResponse
  if (isApiErrorResponse(error)) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    return createErrorResponse(
      error.message,
      ErrorCodes.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    );
  }

  // Appwrite error
  if (isAppwriteError(error)) {
    return createErrorResponse(
      error.message || 'Veritabanı hatası',
      ErrorCodes.DATABASE_ERROR,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }

  // String error
  if (typeof error === 'string') {
    return createErrorResponse(error, ErrorCodes.INTERNAL_ERROR);
  }

  // Unknown error
  return createErrorResponse(
    fallbackMessage || 'Beklenmeyen bir hata oluştu',
    ErrorCodes.INTERNAL_ERROR,
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}

/**
 * Type guard for ApiErrorResponse
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    value.success === false &&
    'error' in value &&
    typeof (value as ApiErrorResponse).error === 'string'
  );
}

/**
 * Type guard for ApiSuccessResponse
 */
export function isApiSuccessResponse<T = unknown>(
  value: unknown
): value is ApiSuccessResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    value.success === true &&
    'data' in value
  );
}

/**
 * Type guard for Appwrite errors
 */
function isAppwriteError(error: unknown): error is { message?: string; code?: number; type?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'code' in error || 'type' in error)
  );
}

/**
 * HTTP status code mapping for error codes
 */
export function getStatusCodeForError(code?: ErrorCode): number {
  switch (code) {
    case ErrorCodes.UNAUTHORIZED:
    case ErrorCodes.INVALID_TOKEN:
    case ErrorCodes.SESSION_EXPIRED:
      return 401;

    case ErrorCodes.FORBIDDEN:
    case ErrorCodes.PERMISSION_DENIED:
    case ErrorCodes.INVALID_CSRF:
      return 403;

    case ErrorCodes.NOT_FOUND:
      return 404;

    case ErrorCodes.ALREADY_EXISTS:
    case ErrorCodes.DUPLICATE_ENTRY:
      return 409;

    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.INVALID_INPUT:
    case ErrorCodes.REQUIRED_FIELD:
      return 400;

    case ErrorCodes.RATE_LIMIT_EXCEEDED:
      return 429;

    case ErrorCodes.WORKFLOW_ERROR:
    case ErrorCodes.OPERATION_NOT_ALLOWED:
      return 422;

    case ErrorCodes.INTERNAL_ERROR:
    case ErrorCodes.DATABASE_ERROR:
    case ErrorCodes.EXTERNAL_SERVICE_ERROR:
    default:
      return 500;
  }
}
