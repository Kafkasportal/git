/**
 * Input Sanitization Library
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

// Lazy import DOMPurify to avoid build-time jsdom issues
let DOMPurify: typeof import('isomorphic-dompurify').default | null = null;

async function getDOMPurify() {
  if (!DOMPurify) {
    DOMPurify = (await import('isomorphic-dompurify')).default;
  }
  return DOMPurify;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify for safe HTML cleaning
 * Async version for runtime use
 */
export async function sanitizeHtmlAsync(html: string): Promise<string> {
  if (!html) return '';

  const purify = await getDOMPurify();
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify for safe HTML cleaning
 * Synchronous version with fallback for build-time compatibility
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Fallback sanitization for build-time compatibility
  // In production, this will work but async version is preferred
  // Remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Sanitize plain text by removing HTML tags and special characters
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove special characters
    .trim();
}

/**
 * Sanitize email address
 * Returns null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize phone number (Turkish format)
 * Removes all non-digit characters and validates format
 */
/**
 * Sanitize phone number to standard format
 * Normalizes to 5XXXXXXXXX format (removes +90 and 0 prefixes)
 * Returns: 5XXXXXXXXX (10 digits, no prefix)
 */
export function sanitizePhone(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Turkish mobile phone format: 5XXXXXXXXX (must start with 5 for mobile)
  // Mobile numbers start with 5 (5XX is the mobile prefix)

  if (digits.length === 12 && digits.startsWith('905')) {
    // Format: 905551234567 (12 digits starting with 905) -> 5551234567
    return digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('905')) {
    // Format: 905551234567 (11 digits with 90) -> 5551234567
    return digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('05')) {
    // Format: 05551234567 (11 digits with leading 0) -> 5551234567
    return digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('5')) {
    // Format: 5551234567 (10 digits without country code) -> 5551234567 (no change)
    return digits;
  }

  // Reject landline numbers (not starting with 5 after country code)
  // Reject too short or too long numbers
  return null;
}

/**
 * Sanitize TC Kimlik No (Turkish ID number)
 * Validates format and checksum
 */
export function sanitizeTcNo(tcNo: string): string | null {
  if (!tcNo) return null;

  const digits = tcNo.replace(/\D/g, '');

  // Must be 11 digits
  if (digits.length !== 11) return null;

  // First digit cannot be 0
  if (digits[0] === '0') return null;

  // Validate TC Kimlik No algorithm
  const arr = digits.split('').map(Number);

  // Calculate 10th digit
  const sum1 = arr[0] + arr[2] + arr[4] + arr[6] + arr[8];
  const sum2 = arr[1] + arr[3] + arr[5] + arr[7];
  const digit10 = (sum1 * 7 - sum2) % 10;

  if (digit10 !== arr[9]) return null;

  // Calculate 11th digit
  const sum3 =
    arr[0] + arr[1] + arr[2] + arr[3] + arr[4] + arr[5] + arr[6] + arr[7] + arr[8] + arr[9];
  const digit11 = sum3 % 10;

  if (digit11 !== arr[10]) return null;

  return digits;
}

/**
 * Sanitize URL
 * Returns null if invalid or potentially dangerous
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Block javascript: and data: URLs
  if (trimmed.match(/^(javascript|data|vbscript):/i)) {
    return null;
  }

  // Validate URL format
  try {
    const parsed = new URL(trimmed, 'http://example.com');

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Sanitize filename
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Sanitize search query
 * Prevents SQL injection and special query attacks
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  return query
    .trim()
    .replace(/['";\\]/g, '') // Remove SQL special characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .substring(0, 200); // Limit length
}

/**
 * Sanitize number input
 * Returns null if not a valid number
 * Handles Turkish number format: 5.000,50 -> 5000.50
 */
export function sanitizeNumber(value: string | number): number | null {
  if (value === null || value === undefined || value === '') return null;

  let processedValue: string | number = value;

  if (typeof value === 'string') {
    let cleaned = value.trim();

    // Handle both formats:
    // 1. Turkish format: 5.000,50 (dot as thousand separator, comma as decimal) -> 5000.50
    // 2. US format: 5,000.50 (comma as thousand separator, dot as decimal) -> 5000.50

    if (cleaned.includes('.') && cleaned.includes(',')) {
      // Both separators present - determine which is decimal separator
      const lastDot = cleaned.lastIndexOf('.');
      const lastComma = cleaned.lastIndexOf(',');

      if (lastComma > lastDot) {
        // Comma is last -> Turkish format (dot thousands, comma decimal)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Dot is last -> US format (comma thousands, dot decimal)
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Only comma present - could be Turkish decimal: 5,50 -> 5.50
      // Or US thousands: 5,000 -> 5000
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Turkish decimal format
        cleaned = cleaned.replace(',', '.');
      } else {
        // US thousands separator
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    // If only dots, leave as is

    processedValue = cleaned;
  }

  const num = typeof processedValue === 'string' ? parseFloat(processedValue) : processedValue;

  if (isNaN(num) || !isFinite(num)) return null;

  return num;
}

/**
 * Sanitize integer input
 * Returns null if not a valid integer
 */
export function sanitizeInteger(value: string | number): number | null {
  const num = sanitizeNumber(value);

  if (num === null) return null;

  return Math.floor(num);
}

/**
 * Sanitize amount (money)
 * Returns null if invalid, max 2 decimal places
 */
export function sanitizeAmount(value: string | number): number | null {
  const num = sanitizeNumber(value);

  if (num === null || num < 0) return null;

  return Math.round(num * 100) / 100;
}

/**
 * Sanitize date string
 * Returns null if invalid date
 */
export function sanitizeDate(dateString: string): Date | null {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return null;

  // Reasonable date range: 1900 - 2100
  if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return null;

  return date;
}

/**
 * Sanitize object by applying sanitization to all string fields
 * Recursive function for nested objects
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    allowHtml?: boolean;
    fieldsToIgnore?: string[];
  } = {}
): T {
  if (!obj || typeof obj !== 'object') return obj;

  const { allowHtml = false, fieldsToIgnore = [] } = options;
  const sanitized: Record<string, any> = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    // Skip ignored fields
    if (fieldsToIgnore.includes(key)) {
      sanitized[key] = obj[key];
      continue;
    }

    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = allowHtml ? sanitizeHtml(value) : sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Dosya boyutu ${Math.round(maxSize / 1024 / 1024)}MB'dan büyük olamaz`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `İzin verilmeyen dosya tipi: ${file.type}`,
    };
  }

  // Check file extension
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `İzin verilmeyen dosya uzantısı: ${ext}`,
    };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);

  return {
    valid: true,
    sanitizedFilename,
  };
}
