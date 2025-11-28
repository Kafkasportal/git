/**
 * Application Error System
 * Provides typed error handling across the application
 */

import logger from '@/lib/logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error codes for different error scenarios
 */
export enum ErrorCode {
  // Validation errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',

  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Resource errors (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  REQUEST_FAILED = 'REQUEST_FAILED',

  // Application errors
  OPERATION_FAILED = 'OPERATION_FAILED',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  INVALID_STATE = 'INVALID_STATE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly id: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    options?: {
      severity?: ErrorSeverity;
      statusCode?: number;
      details?: Record<string, unknown>;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = options?.severity ?? ErrorSeverity.MEDIUM;
    this.statusCode = options?.statusCode ?? 500;
    this.details = options?.details;
    this.context = options?.context;
    this.timestamp = new Date();
    this.id = this.generateErrorId();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      statusCode: this.statusCode,
      details: this.details,
      context: this.context,
      timestamp: this.timestamp,
    };
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    options?: {
      details?: Record<string, unknown>;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, {
      severity: ErrorSeverity.LOW,
      statusCode: 400,
      details: options?.details,
      context: options?.context,
    });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', options?: { context?: Record<string, unknown> }) {
    super(message, ErrorCode.UNAUTHORIZED, {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 401,
      context: options?.context,
    });
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', options?: { context?: Record<string, unknown> }) {
    super(message, ErrorCode.FORBIDDEN, {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 403,
      context: options?.context,
    });
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, options?: { context?: Record<string, unknown> }) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, {
      severity: ErrorSeverity.LOW,
      statusCode: 404,
      context: options?.context,
    });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error (duplicate, etc.)
 */
export class ConflictError extends AppError {
  constructor(message: string, options?: { context?: Record<string, unknown> }) {
    super(message, ErrorCode.CONFLICT, {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 409,
      context: options?.context,
    });
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(message = 'Network request failed', options?: { context?: Record<string, unknown> }) {
    super(message, ErrorCode.NETWORK_ERROR, {
      severity: ErrorSeverity.HIGH,
      statusCode: 503,
      context: options?.context,
    });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AppError {
  constructor(message = 'Request timeout', options?: { context?: Record<string, unknown> }) {
    super(message, ErrorCode.TIMEOUT, {
      severity: ErrorSeverity.HIGH,
      statusCode: 504,
      context: options?.context,
    });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(
    message = 'Database operation failed',
    options?: { context?: Record<string, unknown> }
  ) {
    super(message, ErrorCode.DATABASE_ERROR, {
      severity: ErrorSeverity.CRITICAL,
      statusCode: 500,
      context: options?.context,
    });
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Operation error
 */
export class OperationError extends AppError {
  constructor(message: string, options?: { context?: Record<string, unknown> }) {
    super(message, ErrorCode.OPERATION_FAILED, {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 422,
      context: options?.context,
    });
    this.name = 'OperationError';
    Object.setPrototypeOf(this, OperationError.prototype);
  }
}

/**
 * Create error from unknown source
 */
export function createErrorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, {
      severity: ErrorSeverity.HIGH,
      context: { originalError: error.toString() },
    });
  }

  if (typeof error === 'string') {
    return new AppError(error, ErrorCode.UNKNOWN_ERROR, {
      severity: ErrorSeverity.MEDIUM,
    });
  }

  return new AppError('An unknown error occurred', ErrorCode.UNKNOWN_ERROR, {
    severity: ErrorSeverity.HIGH,
    context: { originalError: String(error) },
  });
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle error and return user-friendly message
   */
  static getUserMessage(error: AppError): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
      [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
      [ErrorCode.INVALID_EMAIL]: 'Please enter a valid email address',
      [ErrorCode.INVALID_PHONE]: 'Please enter a valid phone number',
      [ErrorCode.UNAUTHORIZED]: 'Please log in to continue',
      [ErrorCode.UNAUTHENTICATED]: 'Your session has expired',
      [ErrorCode.SESSION_EXPIRED]: 'Please log in again',
      [ErrorCode.INVALID_CREDENTIALS]: 'Invalid username or password',
      [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
      [ErrorCode.ACCESS_DENIED]: 'Access denied',
      [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
      [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
      [ErrorCode.CONFLICT]: 'This resource already exists',
      [ErrorCode.DUPLICATE_ENTRY]: 'This entry already exists',
      [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
      [ErrorCode.TIMEOUT]: 'The request took too long. Please try again',
      [ErrorCode.DATABASE_ERROR]: 'Database error occurred',
      [ErrorCode.NETWORK_ERROR]: 'Network connection error',
      [ErrorCode.CONNECTION_FAILED]: 'Failed to connect to server',
      [ErrorCode.REQUEST_FAILED]: 'Request failed',
      [ErrorCode.OPERATION_FAILED]: 'Operation failed',
      [ErrorCode.OPERATION_CANCELLED]: 'Operation was cancelled',
      [ErrorCode.INVALID_STATE]: 'Invalid state',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
    };

    return messages[error.code] || error.message;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    const retryableCodes = [
      ErrorCode.TIMEOUT,
      ErrorCode.NETWORK_ERROR,
      ErrorCode.CONNECTION_FAILED,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.REQUEST_FAILED,
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Check if error requires user attention
   */
  static requiresUserAttention(error: AppError): boolean {
    const requiresAttentionCodes = [
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.FORBIDDEN,
      ErrorCode.NOT_FOUND,
      ErrorCode.CONFLICT,
    ];

    return requiresAttentionCodes.includes(error.code);
  }

  /**
   * Log error for debugging
   */
  static log(error: AppError): void {
    const logMessage = `${error.name}: ${error.message}`;

    if (error.severity === ErrorSeverity.CRITICAL) {
      logger.error(logMessage, error, error.toJSON());
    } else if (error.severity === ErrorSeverity.HIGH) {
      logger.warn(logMessage, error, error.toJSON());
    } else {
      logger.warn(logMessage, error, error.toJSON());
    }
  }
}
