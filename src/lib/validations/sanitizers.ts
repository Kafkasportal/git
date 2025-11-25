/**
 * Data Sanitization and Validation Utilities
 * Provides utilities for cleaning and validating user input
 */

/**
 * Sanitize string input by removing potentially harmful characters
 */
export function sanitizeString(input: string, options?: { allowHtml?: boolean }): string {
  let result = input.trim();

  if (!options?.allowHtml) {
    // Remove HTML tags
    result = result.replace(/<[^>]*>/g, '');
  }

  // Remove null bytes
  result = result.replace(/\0/g, '');

  // Remove control characters
  result = result.replace(/[\x00-\x1F\x7F]/g, '');

  return result;
}

/**
 * Sanitize object by recursively removing potentially harmful values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>) as any;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>);
        }
        return item;
      }) as any;
    }
  }

  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Turkish format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+90|0)[\d\s\-()]{9,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate Turkish ID number (TC Kimlik)
 */
export function isValidTcNo(tcNo: string): boolean {
  // Must be 11 digits
  if (!/^\d{11}$/.test(tcNo)) {
    return false;
  }

  // Implement Luhn-like algorithm for TC validation
  const digits = tcNo.split('').map(Number);

  // First digit cannot be 0
  if (digits[0] === 0) {
    return false;
  }

  // Calculate checksum
  let sum1 = 0;
  for (let i = 0; i < 10; i += 2) {
    sum1 += digits[i];
  }

  let sum2 = 0;
  for (let i = 1; i < 10; i += 2) {
    sum2 += digits[i];
  }

  const checkDigit1 = (sum1 * 7 - sum2) % 10;
  if (checkDigit1 !== digits[10]) {
    return false;
  }

  const sum3 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const checkDigit2 = sum3 % 10;
  if (checkDigit2 !== digits[10]) {
    return false;
  }

  return true;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate string length
 */
export function isValidLength(value: string, minLength: number, maxLength?: number): boolean {
  const length = value.length;
  if (length < minLength) {
    return false;
  }

  if (maxLength !== undefined && length > maxLength) {
    return false;
  }

  return true;
}

/**
 * Validate array not empty
 */
export function isNonEmptyArray<T>(array: T[]): boolean {
  return Array.isArray(array) && array.length > 0;
}

/**
 * Validate object not empty
 */
export function isNonEmptyObject(obj: Record<string, unknown>): boolean {
  return obj !== null && typeof obj === 'object' && Object.keys(obj).length > 0;
}

/**
 * Normalize phone number (Turkish format)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.startsWith('90')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return `+90${digits.substring(1)}`;
  } else {
    return `+90${digits}`;
  }
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Slugify string for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate string with ellipsis
 */
export function truncateString(text: string, length: number, ellipsis = '...'): string {
  if (text.length <= length) {
    return text;
  }

  return text.substring(0, length).trimEnd() + ellipsis;
}

/**
 * Mask sensitive information (credit card, SSN, etc.)
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) {
    return data;
  }

  const masked = '*'.repeat(data.length - visibleChars);
  return masked + data.substring(data.length - visibleChars);
}

/**
 * Check for SQL injection patterns
 */
export function hasSqlInjectionPattern(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT|UNION)\b)/i,
    /(--|\#|\/\*)/,
    /[\x00'\"`]/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function hasXssPattern(input: string): boolean {
  const xssPatterns = [/<script[^>]*>[\s\S]*?<\/script>/gi, /on\w+\s*=/gi, /<iframe/gi];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate input against common security issues
 */
export function isSecureInput(input: string): boolean {
  if (hasSqlInjectionPattern(input)) {
    return false;
  }

  if (hasXssPattern(input)) {
    return false;
  }

  return true;
}

/**
 * Create validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate input against multiple rules
 */
export function validateInput(
  input: unknown,
  rules: Array<{
    check: (value: unknown) => boolean;
    error: string;
  }>
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.check(input)) {
      errors.push(rule.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email with detailed result
 */
export function validateEmail(email: string): ValidationResult {
  return validateInput(email, [
    { check: (v) => typeof v === 'string', error: 'Email must be a string' },
    { check: (v) => (v as string).length > 0, error: 'Email is required' },
    { check: (v) => isValidEmail(v as string), error: 'Invalid email format' },
    { check: (v) => isSecureInput(v as string), error: 'Email contains invalid characters' },
  ]);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  return validateInput(password, [
    { check: (v) => typeof v === 'string', error: 'Password must be a string' },
    { check: (v) => (v as string).length >= 8, error: 'Password must be at least 8 characters' },
    {
      check: (v) => /[A-Z]/.test(v as string),
      error: 'Password must contain at least one uppercase letter',
    },
    {
      check: (v) => /[a-z]/.test(v as string),
      error: 'Password must contain at least one lowercase letter',
    },
    {
      check: (v) => /[0-9]/.test(v as string),
      error: 'Password must contain at least one number',
    },
    {
      check: (v) => /[!@#$%^&*]/.test(v as string),
      error: 'Password must contain at least one special character (!@#$%^&*)',
    },
  ]);
}
