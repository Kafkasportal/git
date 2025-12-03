/**
 * Edge-Compatible CSRF Protection Utilities
 * Uses constant-time comparison without Node.js crypto
 */

/**
 * Get CSRF token header name
 */
export function getCsrfTokenHeaderEdge(): string {
  return 'x-csrf-token';
}

/**
 * Validate CSRF token using constant-time comparison (Edge-compatible)
 */
export function validateCsrfTokenEdge(token: string, expectedToken: string): boolean {
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
