import logger from '@/lib/logger';

// Lazy import DOMPurify to avoid build-time jsdom issues
let DOMPurify: typeof import('isomorphic-dompurify').default | null = null;

async function getDOMPurify() {
  if (!DOMPurify) {
    DOMPurify = (await import('isomorphic-dompurify')).default;
  }
  return DOMPurify;
}

// Input sanitization utilities
export class InputSanitizer {
  static async sanitizeHtml(input: string): Promise<string> {
    const purify = await getDOMPurify();
    return purify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: [],
    });
  }

  // Synchronous version for backward compatibility (uses sync import)
  static sanitizeHtmlSync(input: string): string {
    // This is a fallback - in production, prefer async version
    // For build-time compatibility, we'll use a simple regex-based sanitization
    // In runtime, this should use the async version
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static sanitizeText(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>'"&]/g, '');
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    // Turkish phone validation
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  static validateTCNo(tcNo: string): boolean {
    // Turkish ID number validation
    if (tcNo.length !== 11 || !/^\d+$/.test(tcNo)) return false;

    const digits = tcNo.split('').map(Number);
    const sum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    const checksum = ((sum % 10) + digits[9]) % 10;

    return checksum === digits[10];
  }

  static escapeSql(input: string): string {
    // Basic SQL injection prevention
    return input.replace(/['"\\]/g, '\\$&');
  }
}

// Rate limiting utilities
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class RateLimiter {
  private static attempts = new Map<string, RateLimitRecord>();
  private static violations = new Map<string, number>();

  // Whitelist and blacklist configuration
  private static whitelistIPs = new Set(
    process.env.RATE_LIMIT_WHITELIST_IPS?.split(',').map((ip) => ip.trim()) || []
  );
  private static blacklistIPs = new Set(
    process.env.RATE_LIMIT_BLACKLIST_IPS?.split(',').map((ip) => ip.trim()) || []
  );

  // Configurable limits via environment variables
  private static defaultConfig: RateLimitConfig = {
    maxRequests: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW || '900000'), // 15 minutes
  };

  // Premium user multiplier (authenticated users get higher limits)
  private static premiumMultiplier = parseFloat(process.env.RATE_LIMIT_PREMIUM_MULTIPLIER || '2.0');

  static checkLimit(
    identifier: string,
    maxAttempts?: number,
    windowMs?: number,
    userId?: string,
    isAuthenticated: boolean = false
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();

    // Extract IP from identifier
    const ip = identifier.split('-')[0];

    // Check whitelist (skip rate limiting)
    if (this.whitelistIPs.has(ip)) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: now + windowMs!,
      };
    }

    // Check blacklist (always deny)
    if (this.blacklistIPs.has(ip)) {
      this.recordViolation(identifier);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (windowMs || this.defaultConfig.windowMs),
      };
    }

    const config: RateLimitConfig = {
      maxRequests: maxAttempts || this.defaultConfig.maxRequests,
      windowMs: windowMs || this.defaultConfig.windowMs,
    };

    // Apply premium multiplier for authenticated users
    if (isAuthenticated && userId) {
      config.maxRequests = Math.floor(config.maxRequests * this.premiumMultiplier);
    }

    const record = this.attempts.get(identifier);

    // Reset if window has expired
    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      };
      this.attempts.set(identifier, newRecord);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      this.recordViolation(identifier);

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // Increment counter
    record.count++;

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  static getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.defaultConfig.maxRequests;

    const now = Date.now();
    if (now > record.resetTime) {
      return this.defaultConfig.maxRequests;
    }

    return Math.max(0, this.defaultConfig.maxRequests - record.count);
  }

  static getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  static resetAll(): void {
    this.attempts.clear();
    this.violations.clear();
  }

  private static recordViolation(identifier: string): void {
    const currentViolations = this.violations.get(identifier) || 0;
    this.violations.set(identifier, currentViolations + 1);

    logger.warn('Rate limit violation', {
      identifier,
      violations: currentViolations + 1,
      timestamp: new Date().toISOString(),
      type: 'rate_limit_violation',
    });
  }

  static getViolationCount(identifier: string): number {
    return this.violations.get(identifier) || 0;
  }

  static getAllViolations(): Array<{ identifier: string; count: number }> {
    return Array.from(this.violations.entries()).map(([identifier, count]) => ({
      identifier,
      count,
    }));
  }

  static getStats(): {
    totalRequests: number;
    activeLimits: number;
    totalViolations: number;
    whitelistedIPs: number;
    blacklistedIPs: number;
  } {
    const totalRequests = Array.from(this.attempts.values()).reduce(
      (sum, record) => sum + record.count,
      0
    );

    const totalViolations = Array.from(this.violations.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalRequests,
      activeLimits: this.attempts.size,
      totalViolations,
      whitelistedIPs: this.whitelistIPs.size,
      blacklistedIPs: this.blacklistIPs.size,
    };
  }

  static updateWhitelist(ips: string[]): void {
    this.whitelistIPs = new Set(ips);
  }

  static updateBlacklist(ips: string[]): void {
    this.blacklistIPs = new Set(ips);
  }

  static addToWhitelist(ip: string): void {
    this.whitelistIPs.add(ip);
  }

  static addToBlacklist(ip: string): void {
    this.blacklistIPs.add(ip);
  }

  static removeFromWhitelist(ip: string): void {
    this.whitelistIPs.delete(ip);
  }

  static removeFromBlacklist(ip: string): void {
    this.blacklistIPs.delete(ip);
  }
}

// File upload security
export class FileSecurity {
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];

  private static readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Desteklenmeyen dosya türü: ${file.type}`,
      };
    }

    // Check file size
    if (file.size > this.MAX_SIZE) {
      return {
        valid: false,
        error: `Dosya boyutu çok büyük. Maksimum: ${this.MAX_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Check file name for path traversal
    const fileName = file.name;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return {
        valid: false,
        error: 'Geçersiz dosya adı',
      };
    }

    return { valid: true };
  }

  static sanitizeFileName(fileName: string): string {
    // Remove potentially dangerous characters
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  static async scanForMalware(file: File): Promise<{ safe: boolean; error?: string }> {
    // Basic malware scanning (in production, use a proper AV service)
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for common malware signatures
    const malwareSignatures = [
      [0x4d, 0x5a], // MZ header (Windows executable)
      [0x7f, 0x45, 0x4c, 0x46], // ELF header (Linux executable)
    ];

    for (const signature of malwareSignatures) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        return {
          safe: false,
          error: 'Şüpheli dosya içeriği tespit edildi',
        };
      }
    }

    return { safe: true };
  }
}

// Audit logging
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
  error?: string;
}

export class AuditLogger {
  private static logs: AuditLog[] = [];
  private static maxLogs = 1000; // Keep last 1000 logs in memory

  static log(logData: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditLog: AuditLog = {
      ...logData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.logs.push(auditLog);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Determine log level based on severity
    const level: 'info' | 'warn' | 'error' =
      logData.status === 'failure'
        ? 'warn'
        : logData.action.toLowerCase().includes('violation') ||
            logData.action.toLowerCase().includes('security')
          ? 'error'
          : 'info';

    if (process.env.NODE_ENV === 'production') {
      logger[level]('Audit log', {
        action: logData.action,
        resource: logData.resource,
        userId: logData.userId,
        status: logData.status,
        ipAddress: logData.ipAddress,
      });
    } else {
      logger.debug('Audit log', { ...auditLog });
    }
  }

  static getLogs(userId?: string, limit: number = 100): AuditLog[] {
    let filteredLogs = this.logs;

    if (userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === userId);
    }

    return filteredLogs.slice(-limit).reverse();
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// CSRF protection
export class CSRFProtection {
  static generateToken(): string {
    return crypto.randomUUID();
  }

  static validateToken(sessionToken: string | null, requestToken: string | null): boolean {
    if (!sessionToken || !requestToken) return false;
    return sessionToken === requestToken;
  }
}

// Password security
export class PasswordSecurity {
  static validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Test ortamı için gevşetilmiş kurallar
    if (process.env.NODE_ENV === 'development') {
      if (password.length < 6) {
        errors.push('Şifre en az 6 karakter olmalıdır');
      }
      return {
        valid: errors.length === 0,
        errors,
      };
    }

    // Production ortamı için sıkı kurallar
    if (password.length < 8) {
      errors.push('Şifre en az 8 karakter olmalıdır');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Şifre en az bir büyük harf içermelidir');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Şifre en az bir küçük harf içermelidir');
    }

    if (!/\d/.test(password)) {
      errors.push('Şifre en az bir rakam içermelidir');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Şifre en az bir özel karakter içermelidir');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static generateSecurePassword(length: number = 12): string {
    // Use crypto.getRandomValues for secure random generation
    const charTypes = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*',
    };

    const allChars = Object.values(charTypes).join('');
    const array = new Uint8Array(length);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback to Math.random for environments without crypto
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += allChars[array[i] % allChars.length];
    }

    return password;
  }
}
