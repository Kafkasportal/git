/**
 * Account Lockout Protection
 * Prevents brute force attacks by locking accounts after failed login attempts
 */

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

// In-memory store (for production, use Redis or database)
const failedAttempts = new Map<string, LoginAttempt[]>();
const lockedAccounts = new Map<string, number>(); // email -> unlock timestamp

/**
 * Lockout configuration
 */
export const LOCKOUT_CONFIG = {
  maxAttempts: 5, // Max failed attempts before lockout
  attemptWindow: 15 * 60 * 1000, // 15 minutes window for attempts
  lockoutDuration: 30 * 60 * 1000, // 30 minutes lockout
  cleanupInterval: 60 * 60 * 1000, // Clean old attempts every hour
} as const;

/**
 * Check if account is currently locked
 */
export function isAccountLocked(email: string): boolean {
  const lockExpiry = lockedAccounts.get(email.toLowerCase());

  if (!lockExpiry) {
    return false;
  }

  const now = Date.now();

  // Check if lock has expired
  if (now >= lockExpiry) {
    lockedAccounts.delete(email.toLowerCase());
    failedAttempts.delete(email.toLowerCase());
    return false;
  }

  return true;
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockoutTime(email: string): number {
  const lockExpiry = lockedAccounts.get(email.toLowerCase());

  if (!lockExpiry) {
    return 0;
  }

  const remainingMs = lockExpiry - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/**
 * Record a login attempt (success or failure)
 */
export function recordLoginAttempt(email: string, success: boolean): void {
  const normalizedEmail = email.toLowerCase();
  const now = Date.now();

  // Get existing attempts
  let attempts = failedAttempts.get(normalizedEmail) || [];

  // Clean old attempts (outside the window)
  const windowStart = now - LOCKOUT_CONFIG.attemptWindow;
  attempts = attempts.filter((attempt) => attempt.timestamp >= windowStart);

  if (success) {
    // Clear failed attempts on successful login
    failedAttempts.delete(normalizedEmail);
    lockedAccounts.delete(normalizedEmail);
    return;
  }

  // Record failed attempt
  attempts.push({
    email: normalizedEmail,
    timestamp: now,
    success: false,
  });

  failedAttempts.set(normalizedEmail, attempts);

  // Check if should lock account
  if (attempts.length >= LOCKOUT_CONFIG.maxAttempts) {
    const lockUntil = now + LOCKOUT_CONFIG.lockoutDuration;
    lockedAccounts.set(normalizedEmail, lockUntil);
  }
}

/**
 * Get number of failed attempts in current window
 */
export function getFailedAttemptCount(email: string): number {
  const normalizedEmail = email.toLowerCase();
  const attempts = failedAttempts.get(normalizedEmail) || [];
  const now = Date.now();
  const windowStart = now - LOCKOUT_CONFIG.attemptWindow;

  return attempts.filter((attempt) => attempt.timestamp >= windowStart && !attempt.success).length;
}

/**
 * Manually unlock an account (admin action)
 */
export function unlockAccount(email: string): void {
  const normalizedEmail = email.toLowerCase();
  failedAttempts.delete(normalizedEmail);
  lockedAccounts.delete(normalizedEmail);
}

/**
 * Cleanup old attempts (should be called periodically)
 */
export function cleanupOldAttempts(): void {
  const now = Date.now();
  const windowStart = now - LOCKOUT_CONFIG.attemptWindow;

  // Clean failed attempts
  for (const [email, attempts] of failedAttempts.entries()) {
    const validAttempts = attempts.filter((attempt) => attempt.timestamp >= windowStart);

    if (validAttempts.length === 0) {
      failedAttempts.delete(email);
    } else {
      failedAttempts.set(email, validAttempts);
    }
  }

  // Clean expired locks
  for (const [email, lockExpiry] of lockedAccounts.entries()) {
    if (now >= lockExpiry) {
      lockedAccounts.delete(email);
    }
  }
}

// Start cleanup interval (only in server context)
if (typeof window === 'undefined') {
  setInterval(cleanupOldAttempts, LOCKOUT_CONFIG.cleanupInterval);
}

/**
 * Get lockout status for an account
 */
export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  remainingAttempts: number;
}

export function getLockoutStatus(email: string): LockoutStatus {
  const isLocked = isAccountLocked(email);
  const remainingSeconds = getRemainingLockoutTime(email);
  const failedAttempts = getFailedAttemptCount(email);
  const remainingAttempts = Math.max(0, LOCKOUT_CONFIG.maxAttempts - failedAttempts);

  return {
    isLocked,
    remainingSeconds,
    failedAttempts,
    remainingAttempts,
  };
}
