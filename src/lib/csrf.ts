/**
 * CSRF Protection Utilities - Server Side
 * Generate and validate CSRF tokens for state-changing operations
 * 
 * IMPORTANT: This file uses Node.js crypto and should ONLY be imported in:
 * - API routes (src/app/api/*)
 * - Server components
 * - Server-side code
 * 
 * For client-side CSRF functions, use @/lib/csrf-client instead.
 */

import { randomBytes } from 'node:crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 * SERVER ONLY - Uses Node.js crypto
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Get CSRF token header name
 */
export function getCsrfTokenHeader(): string {
  return CSRF_TOKEN_HEADER;
}

/**
 * Validate CSRF token (constant-time comparison)
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // Ensure same length to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

// Re-export client functions for backward compatibility in server-side code
export {
  getCsrfTokenFromCookie,
  fetchWithCsrf,
} from './csrf-client';
