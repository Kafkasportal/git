/**
 * CSRF Protection Utilities
 * Generate and validate CSRF tokens for state-changing operations
 */

import { randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
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

/**
 * Client-side: Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Client-side: Fetch wrapper with CSRF token
 */
export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCsrfTokenFromCookie();

  const headers = new Headers(options.headers);
  if (csrfToken && shouldIncludeCsrfToken(options.method)) {
    headers.set(CSRF_TOKEN_HEADER, csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Check if method requires CSRF token
 */
function shouldIncludeCsrfToken(method: string = 'GET'): boolean {
  const upperMethod = method.toUpperCase();
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod);
}
