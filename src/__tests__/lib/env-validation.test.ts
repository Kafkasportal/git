import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    Object.assign(process.env, originalEnv);
  });

  describe('Client Environment Validation', () => {
    it('should validate client env variables', async () => {
      // Dynamic import to test validation
      const { validateClientEnv } = await import('@/lib/env-validation');
      expect(() => validateClientEnv()).not.toThrow();
    });

    it('should use default values for optional variables', async () => {
      const { getClientEnv } = await import('@/lib/env-validation');
      const env = getClientEnv();
      expect(env.NEXT_PUBLIC_APP_NAME).toBe('Dernek Yönetim Sistemi');
      expect(env.NEXT_PUBLIC_APP_VERSION).toBe('1.0.0');
    });
  });

  describe('Server Environment Validation', () => {
    let originalWindow: typeof window;

    beforeEach(() => {
      vi.unstubAllEnvs(); // Clear stubs from previous tests

      // Mock window to be undefined for server-side validation
      originalWindow = global.window;
      (global as any).window = undefined;
    });

    afterEach(() => {
      (global as any).window = originalWindow; // Restore original window
    });

    it('should validate server env variables', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('CSRF_SECRET', 'a'.repeat(32));
      vi.stubEnv('SESSION_SECRET', 'b'.repeat(32));

      const { validateServerEnv } = await import('@/lib/env-validation');
      expect(() => validateServerEnv()).not.toThrow();
    });

    it('should validate secret length in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CSRF_SECRET', 'too-short'); // Less than 32 chars
      vi.stubEnv('SESSION_SECRET', 'b'.repeat(32));

      const { validateServerEnv } = await import('@/lib/env-validation');
      expect(() => validateServerEnv()).toThrow();
    });
  });

  describe('Feature Flags', () => {
    it('should parse boolean feature flags', async () => {
      process.env.NEXT_PUBLIC_ENABLE_REALTIME = 'false';
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';

      const { getClientEnv } = await import('@/lib/env-validation');
      const env = getClientEnv();
      expect(env.NEXT_PUBLIC_ENABLE_REALTIME).toBe(false);
      expect(env.NEXT_PUBLIC_ENABLE_ANALYTICS).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should detect email configuration', async () => {
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_USER = 'test@gmail.com';
      process.env.SMTP_PASSWORD = 'password';

      const { hasEmailConfig } = await import('@/lib/env-validation');
      const mockEnv = {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'test@gmail.com',
        SMTP_PASSWORD: 'password',
      } as any;
      expect(hasEmailConfig(mockEnv)).toBe(true);
    });

    it('should detect SMS configuration', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC123';
      process.env.TWILIO_AUTH_TOKEN = 'token123';
      process.env.TWILIO_PHONE_NUMBER = '+905551234567';

      const { hasSmsConfig } = await import('@/lib/env-validation');
      const mockEnv = {
        TWILIO_ACCOUNT_SID: 'AC123',
        TWILIO_AUTH_TOKEN: 'token123',
        TWILIO_PHONE_NUMBER: '+905551234567',
      } as any;
      expect(hasSmsConfig(mockEnv)).toBe(true);
    });
  });
});
