/**
 * Password Strength Validation and Requirements
 */

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Minimum password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 100,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
} as const;

/**
 * Check if password meets strength requirements
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];

  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate score (0-4)
  let score = 0;

  if (requirements.minLength) score++;
  if (requirements.hasUppercase && requirements.hasLowercase) score++;
  if (requirements.hasNumber) score++;
  if (requirements.hasSpecialChar) score++;

  // Generate feedback
  if (!requirements.minLength) {
    feedback.push(`Şifre en az ${PASSWORD_REQUIREMENTS.minLength} karakter olmalıdır`);
  }
  if (PASSWORD_REQUIREMENTS.maxLength && password.length > PASSWORD_REQUIREMENTS.maxLength) {
    feedback.push(`Şifre en fazla ${PASSWORD_REQUIREMENTS.maxLength} karakter olabilir`);
    return {
      isValid: false,
      score: 0,
      feedback,
      requirements,
    };
  }
  if (!requirements.hasUppercase) {
    feedback.push('Şifre en az bir büyük harf içermelidir');
  }
  if (!requirements.hasLowercase) {
    feedback.push('Şifre en az bir küçük harf içermelidir');
  }
  if (!requirements.hasNumber) {
    feedback.push('Şifre en az bir rakam içermelidir');
  }
  if (!requirements.hasSpecialChar) {
    feedback.push('Şifre en az bir özel karakter içermelidir (!@#$%^&* vb.)');
  }

  // Check for common weak patterns
  const lowerPassword = password.toLowerCase();
  const commonPasswords = ['password', 'sifre', '12345678', 'qwerty', 'admin'];
  if (commonPasswords.some((common) => lowerPassword.includes(common))) {
    feedback.push('Şifre çok yaygın kelimeler içermemelidir');
    score = Math.max(0, score - 1);
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|123|234|345)/i.test(password)) {
    feedback.push('Şifre ardışık karakterler içermemelidir');
    score = Math.max(0, score - 1);
  }

  const isValid = Object.values(requirements).every(Boolean);

  return {
    isValid,
    score,
    feedback,
    requirements,
  };
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Çok zayıf';
    case 2:
      return 'Zayıf';
    case 3:
      return 'Orta';
    case 4:
      return 'Güçlü';
    default:
      return 'Bilinmiyor';
  }
}

/**
 * Get password strength color class
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-600';
    default:
      return 'text-gray-400';
  }
}
