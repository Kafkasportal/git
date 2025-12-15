/**
 * Middleware Property Tests
 * Property-based tests for rate limiting, CSRF, and authentication
 * 
 * @module properties/middleware
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import {
  RateLimiter,
  CSRFProtection,
  PasswordSecurity,
  FileSecurity,
} from '@/lib/security';
import { validateCsrfToken } from '@/lib/csrf';

// Generators
const validIpAddress = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

const validIdentifier = fc.tuple(validIpAddress, fc.stringMatching(/^[a-z0-9]{5,10}$/))
  .map(([ip, suffix]) => `${ip}-${suffix}`);

describe('Middleware Property Tests', () => {
  beforeEach(() => {
    RateLimiter.resetAll();
  });

  afterEach(() => {
    RateLimiter.resetAll();
  });

  /**
   * **Feature: code-quality-improvement, Property 12: Rate Limit Enforcement**
   * **Validates: Requirements 7.1**
   * 
   * For any request pattern exceeding the configured limit (100 req/15min),
   * subsequent requests SHALL receive 429 status.
   */
  describe('Property 12: Rate Limit Enforcement', () => {
    test.prop([validIdentifier, fc.integer({ min: 5, max: 20 })], { numRuns: 50 })(
      'requests exceeding limit are rejected',
      (identifier, maxRequests) => {
        const windowMs = 60000; // 1 minute for testing
        
        // Make maxRequests allowed requests
        for (let i = 0; i < maxRequests; i++) {
          const result = RateLimiter.checkLimit(identifier, maxRequests, windowMs);
          expect(result.allowed).toBe(true);
        }
        
        // Next request should be rejected
        const exceededResult = RateLimiter.checkLimit(identifier, maxRequests, windowMs);
        expect(exceededResult.allowed).toBe(false);
        expect(exceededResult.remaining).toBe(0);
      }
    );

    it('should reset after window expires', async () => {
      const identifier = '192.168.1.1-test';
      const maxRequests = 3;
      const windowMs = 100; // 100ms for testing
      
      // Exhaust the limit
      for (let i = 0; i < maxRequests; i++) {
        RateLimiter.checkLimit(identifier, maxRequests, windowMs);
      }
      
      // Should be blocked
      expect(RateLimiter.checkLimit(identifier, maxRequests, windowMs).allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      expect(RateLimiter.checkLimit(identifier, maxRequests, windowMs).allowed).toBe(true);
    });

    it('should track remaining attempts correctly', () => {
      const identifier = '192.168.1.2-test';
      const maxRequests = 5;
      const windowMs = 60000;
      
      for (let i = 0; i < maxRequests; i++) {
        const result = RateLimiter.checkLimit(identifier, maxRequests, windowMs);
        expect(result.remaining).toBe(maxRequests - i - 1);
      }
    });
  });


  /**
   * **Feature: code-quality-improvement, Property 13: CSRF Token Validation**
   * **Validates: Requirements 7.2**
   * 
   * For any mutating request (POST/PUT/PATCH/DELETE) without valid CSRF token,
   * the request SHALL be rejected with 403 status.
   */
  describe('Property 13: CSRF Token Validation', () => {
    test.prop([fc.uuid(), fc.uuid()], { numRuns: 100 })(
      'different tokens always fail validation',
      (token1, token2) => {
        // Skip if tokens happen to be the same (extremely unlikely)
        if (token1 === token2) return;
        
        const result = validateCsrfToken(token1, token2);
        expect(result).toBe(false);
      }
    );

    test.prop([fc.uuid()], { numRuns: 100 })(
      'same token always passes validation',
      (token) => {
        const result = validateCsrfToken(token, token);
        expect(result).toBe(true);
      }
    );

    it('should reject null or empty tokens', () => {
      expect(validateCsrfToken('', 'valid-token')).toBe(false);
      expect(validateCsrfToken('valid-token', '')).toBe(false);
      expect(validateCsrfToken('', '')).toBe(false);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(CSRFProtection.generateToken());
      }
      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should use constant-time comparison', () => {
      // This is a basic test - in production you'd use timing analysis
      const token = 'a'.repeat(64);
      const wrongToken1 = `b${'a'.repeat(63)}`; // Wrong at start
      const wrongToken2 = `${'a'.repeat(63)}b`; // Wrong at end
      
      // Both should fail (we can't easily test timing, but we verify correctness)
      expect(validateCsrfToken(token, wrongToken1)).toBe(false);
      expect(validateCsrfToken(token, wrongToken2)).toBe(false);
    });
  });

  /**
   * **Feature: code-quality-improvement, Property 14: Authentication Enforcement**
   * **Validates: Requirements 7.3**
   * 
   * For any request to a protected endpoint without valid session,
   * the request SHALL be rejected with 401 status.
   * 
   * Note: This is tested at the API route level, here we test the
   * supporting security utilities.
   */
  describe('Property 14: Authentication Enforcement', () => {
    describe('Password Security', () => {
      it('should validate password strength based on environment', () => {
        // Test passwords that meet minimum requirements
        const result = PasswordSecurity.validateStrength('Test123!@');
        
        // This password should pass in any environment
        // (8+ chars, uppercase, lowercase, number, special char)
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject weak passwords', () => {
        const weakPasswords = ['12345', 'abc', ''];
        
        weakPasswords.forEach(password => {
          const result = PasswordSecurity.validateStrength(password);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        });
      });

      it('should generate secure passwords', () => {
        const password = PasswordSecurity.generateSecurePassword(16);
        
        expect(password.length).toBe(16);
        // Should contain variety of characters
        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[0-9]/);
      });
    });
  });

  /**
   * File Security Tests
   */
  describe('File Security', () => {
    it('should validate allowed file types', () => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/plain',
      ];
      
      allowedTypes.forEach(type => {
        const mockFile = new File(['test'], 'test.txt', { type });
        const result = FileSecurity.validateFile(mockFile);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject disallowed file types', () => {
      const disallowedTypes = [
        'application/javascript',
        'application/x-executable',
        'text/html',
      ];
      
      disallowedTypes.forEach(type => {
        const mockFile = new File(['test'], 'test.txt', { type });
        const result = FileSecurity.validateFile(mockFile);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject files exceeding size limit', () => {
      // Create a file larger than 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
      
      const result = FileSecurity.validateFile(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('boyut');
    });

    it('should sanitize file names by removing special characters', () => {
      const testCases = [
        { input: 'file\\name.txt', expected: 'file_name.txt' },
        { input: 'file/name.txt', expected: 'file_name.txt' },
        { input: 'file<script>.txt', expected: 'file_script_.txt' },
        { input: 'normal-file.txt', expected: 'normal-file.txt' },
      ];
      
      for (const { input, expected } of testCases) {
        const sanitized = FileSecurity.sanitizeFileName(input);
        expect(sanitized).toBe(expected);
      }
    });

    it('should reject path traversal attempts', () => {
      const pathTraversalNames = [
        '../secret.txt',
        '..\\secret.txt',
        'folder/../secret.txt',
      ];
      
      for (const name of pathTraversalNames) {
        const mockFile = new File(['test'], name, { type: 'text/plain' });
        const result = FileSecurity.validateFile(mockFile);
        expect(result.valid).toBe(false);
      }
    });
  });

  /**
   * Rate Limiter Statistics
   */
  describe('Rate Limiter Statistics', () => {
    it('should track violations correctly', () => {
      const identifier = '192.168.1.3-test';
      const maxRequests = 2;
      const windowMs = 60000;
      
      // Exhaust limit
      RateLimiter.checkLimit(identifier, maxRequests, windowMs);
      RateLimiter.checkLimit(identifier, maxRequests, windowMs);
      
      // Trigger violations
      RateLimiter.checkLimit(identifier, maxRequests, windowMs);
      RateLimiter.checkLimit(identifier, maxRequests, windowMs);
      
      expect(RateLimiter.getViolationCount(identifier)).toBe(2);
    });

    it('should provide accurate stats', () => {
      const identifier1 = '192.168.1.4-test';
      const identifier2 = '192.168.1.5-test';
      
      RateLimiter.checkLimit(identifier1, 10, 60000);
      RateLimiter.checkLimit(identifier1, 10, 60000);
      RateLimiter.checkLimit(identifier2, 10, 60000);
      
      const stats = RateLimiter.getStats();
      
      expect(stats.totalRequests).toBe(3);
      expect(stats.activeLimits).toBe(2);
    });
  });
});
