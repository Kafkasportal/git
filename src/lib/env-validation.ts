/**
 * Environment Variables Validation
 * Validates required environment variables at build time and runtime
 */

import { z } from 'zod';

// Client-side (public) environment variables schema
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().optional().default('Dernek Yönetim Sistemi'),
  NEXT_PUBLIC_APP_VERSION: z.string().optional().default('1.0.0'),
  NEXT_PUBLIC_ENABLE_REALTIME: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  // Sentry Configuration (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
});

// Server-side (private) environment variables schema
const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  // Production requires these secrets
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters').optional(),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters').optional(),
  // Sentry Configuration (Optional)
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Optional email configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Optional SMS configuration
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .default('100')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .default('900000')
    .transform((val) => parseInt(val, 10)),

  // File upload limits
  MAX_FILE_SIZE: z
    .string()
    .optional()
    .default('10485760')
    .transform((val) => parseInt(val, 10)),
  MAX_FILES_PER_UPLOAD: z
    .string()
    .optional()
    .default('5')
    .transform((val) => parseInt(val, 10)),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates client-side environment variables
 * Safe to call in browser
 */
export function validateClientEnv(): ClientEnv {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_ENABLE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(
        `❌ Client environment validation failed:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Validates server-side environment variables
 * Only call on server (API routes, server components, middleware)
 */
export function validateServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv() can only be called on the server side');
  }

  try {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';

    return serverEnvSchema.parse({
      // Client vars
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_ENABLE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Server-only vars
      NODE_ENV: nodeEnv,
      // Require secrets in production
      CSRF_SECRET: isProduction
        ? process.env.CSRF_SECRET
        : process.env.CSRF_SECRET || 'development-csrf-secret-min-32-chars',
      SESSION_SECRET: isProduction
        ? process.env.SESSION_SECRET
        : process.env.SESSION_SECRET || 'development-session-secret-min-32-chars',
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,

      // Optional services
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      SMTP_FROM: process.env.SMTP_FROM,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      MAX_FILES_PER_UPLOAD: process.env.MAX_FILES_PER_UPLOAD,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(
        `❌ Server environment validation failed:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Get validated client environment variables
 * Cached for performance
 */
let cachedClientEnv: ClientEnv | null = null;
export function getClientEnv(): ClientEnv {
  if (!cachedClientEnv) {
    cachedClientEnv = validateClientEnv();
  }
  return cachedClientEnv;
}

/**
 * Get validated server environment variables
 * Cached for performance
 */
let cachedServerEnv: ServerEnv | null = null;
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() can only be called on the server side');
  }

  if (!cachedServerEnv) {
    cachedServerEnv = validateServerEnv();
  }
  return cachedServerEnv;
}

/**
 * Check if email configuration is available
 */
export function hasEmailConfig(env: ServerEnv): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
}

/**
 * Check if SMS configuration is available
 */
export function hasSmsConfig(env: ServerEnv): boolean {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}
