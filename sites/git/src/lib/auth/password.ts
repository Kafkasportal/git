import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Higher salt rounds for better security
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a password meets security requirements
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Şifre gereklidir' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Şifre en az 8 karakter olmalıdır' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Şifre en fazla 128 karakter olabilir' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Şifre en az bir rakam içermelidir' };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Şifre en az bir harf içermelidir' };
  }

  return { valid: true };
}
