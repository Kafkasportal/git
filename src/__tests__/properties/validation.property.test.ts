/**
 * Validation Property Tests
 * Property-based tests for Zod validation schemas
 * 
 * @module properties/validation
 */

import { describe, it, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import {
  tcKimlikNoSchema,
  phoneSchema,
  requiredPhoneSchema,
  emailSchema,
  requiredEmailSchema,
  turkishNameSchema,
  amountSchema,
} from '@/lib/validations/shared-validators';
import { financeRecordBaseSchema } from '@/lib/validations/finance-record';
import {
  validTcKimlikNo,
  validPhoneNumber,
  validEmail,
  validAmount,
  validName,
  validCurrency,
} from '../test-utils/generators';

describe('Validation Property Tests', () => {
  /**
   * **Feature: code-quality-improvement, Property 2: Zod Schema Parse-Serialize Round Trip**
   * **Validates: Requirements 2.2**
   * 
   * For any valid data object, serializing to JSON and parsing back through
   * the Zod schema SHALL produce an equivalent object.
   */
  describe('Property 2: Zod Schema Parse-Serialize Round Trip', () => {
    // Generate pre-trimmed strings to avoid trim transformation differences
    const trimmedDescription = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9\s]{3,98}[a-zA-Z0-9]$/)
      .filter(s => s.trim() === s && s.length >= 5);
    const trimmedCategory = fc.stringMatching(/^[a-zA-Z]{2,50}$/)
      .filter(s => s.trim() === s);

    test.prop([
      fc.record({
        record_type: fc.constantFrom('income', 'expense'),
        category: trimmedCategory,
        amount: fc.integer({ min: 1, max: 999999999 }).map(n => n / 100),
        currency: validCurrency,
        description: trimmedDescription,
        transaction_date: fc.date({ min: new Date('2000-01-01'), max: new Date() }).map(d => d.toISOString()),
        created_by: fc.stringMatching(/^user_[a-z0-9]{5,10}$/),
        status: fc.constantFrom('pending', 'approved', 'rejected'),
      }),
    ], { numRuns: 100 })(
      'finance record round trip preserves data',
      (validRecord) => {
        // Parse the record
        const parseResult = financeRecordBaseSchema.safeParse(validRecord);
        
        if (parseResult.success) {
          // Serialize to JSON
          const serialized = JSON.stringify(parseResult.data);
          
          // Parse back from JSON
          const deserialized = JSON.parse(serialized);
          
          // Parse through schema again
          const reparsed = financeRecordBaseSchema.safeParse(deserialized);
          
          expect(reparsed.success).toBe(true);
          if (reparsed.success) {
            expect(reparsed.data).toEqual(parseResult.data);
          }
        }
      }
    );
  });


  /**
   * **Feature: code-quality-improvement, Property 3: Validation Error Detail Completeness**
   * **Validates: Requirements 2.1**
   * 
   * For any invalid input to a Zod schema, the error response SHALL include
   * the field path and a human-readable error message.
   */
  describe('Property 3: Validation Error Detail Completeness', () => {
    it('should include field path and message for invalid TC Kimlik', () => {
      const invalidValues = [
        '00000000000', // Starts with 0
        '12345678901', // Invalid checksum
        '1234567890',  // Too short
        '123456789012', // Too long
        'abcdefghijk', // Non-numeric
      ];
      
      invalidValues.forEach(invalidTc => {
        const result = tcKimlikNoSchema.safeParse(invalidTc);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          // Zod 4 uses 'issues' instead of 'errors'
          const issues = result.error.issues || [];
          expect(issues.length).toBeGreaterThan(0);
          
          issues.forEach((issue: { path?: unknown[]; message?: string }) => {
            expect(issue.path).toBeDefined();
            expect(issue.message).toBeDefined();
            expect(typeof issue.message).toBe('string');
          });
        }
      });
    });

    it('should include field path and message for invalid emails', () => {
      const invalidValues = [
        'invalid',
        '@nodomain.com',
        'spaces in@email.com',
        '',
      ];
      
      invalidValues.forEach(invalidEmailValue => {
        const result = requiredEmailSchema.safeParse(invalidEmailValue);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          const issues = result.error.issues || [];
          expect(issues.length).toBeGreaterThan(0);
          issues.forEach((issue: { message?: string }) => {
            expect(issue.message).toBeDefined();
            expect(typeof issue.message).toBe('string');
          });
        }
      });
    });

    it('should include descriptive message for invalid amounts', () => {
      const invalidValues = [-100, -0.01, -10000];
      
      invalidValues.forEach(invalidAmountValue => {
        const result = amountSchema.safeParse(invalidAmountValue);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          const issues = result.error.issues || [];
          expect(issues.length).toBeGreaterThan(0);
          issues.forEach((issue: { message?: string }) => {
            expect(issue.message).toBeDefined();
            expect(typeof issue.message).toBe('string');
          });
        }
      });
    });
  });

  /**
   * Additional validation property tests
   */
  describe('TC Kimlik No Validation', () => {
    test.prop([validTcKimlikNo], { numRuns: 100 })(
      'valid TC Kimlik numbers pass validation',
      (validTc) => {
        const result = tcKimlikNoSchema.safeParse(validTc);
        expect(result.success).toBe(true);
      }
    );

    it('should reject invalid TC Kimlik numbers', () => {
      const invalidValues = [
        '00000000000', // Starts with 0
        '12345678901', // Invalid checksum
        '1234567890',  // Too short
        '123456789012', // Too long
        'abcdefghijk', // Non-numeric
      ];
      
      invalidValues.forEach(value => {
        const result = tcKimlikNoSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Phone Number Validation', () => {
    test.prop([validPhoneNumber], { numRuns: 100 })(
      'valid phone numbers pass validation after sanitization',
      (validPhone) => {
        const result = requiredPhoneSchema.safeParse(validPhone);
        expect(result.success).toBe(true);
      }
    );

    it('should sanitize phone numbers correctly', () => {
      // Test various formats that should be sanitized
      const formats = [
        '+905321234567',
        '05321234567',
        '5321234567',
        '+90 532 123 45 67',
        '0532-123-45-67',
      ];

      formats.forEach(format => {
        const result = requiredPhoneSchema.safeParse(format);
        if (result.success) {
          // Should be sanitized to 10 digits starting with 5
          expect(result.data).toMatch(/^5\d{9}$/);
        }
      });
    });
  });

  describe('Email Validation', () => {
    test.prop([validEmail], { numRuns: 100 })(
      'valid emails pass validation',
      (email) => {
        const result = requiredEmailSchema.safeParse(email);
        expect(result.success).toBe(true);
      }
    );

    it('should reject invalid emails', () => {
      const invalidValues = [
        'invalid',
        '@nodomain.com',
        'spaces in@email.com',
        '',
      ];
      
      invalidValues.forEach(value => {
        const result = requiredEmailSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Amount Validation', () => {
    test.prop([validAmount], { numRuns: 100 })(
      'valid amounts pass validation',
      (amount) => {
        const result = amountSchema.safeParse(amount);
        expect(result.success).toBe(true);
      }
    );

    test.prop([fc.double({ min: -10000, max: -0.01 })], { numRuns: 100 })(
      'negative amounts fail validation',
      (negativeAmount) => {
        const result = amountSchema.safeParse(negativeAmount);
        expect(result.success).toBe(false);
      }
    );
  });

  describe('Name Validation', () => {
    test.prop([validName], { numRuns: 100 })(
      'valid Turkish names pass validation',
      (name) => {
        const result = turkishNameSchema.safeParse(name);
        expect(result.success).toBe(true);
      }
    );

    it('should reject empty and too short strings', () => {
      // turkishNameSchema requires min 2 characters and only letters
      const invalidValues = ['', 'A', '1', '12', 'A1'];
      
      invalidValues.forEach(value => {
        const result = turkishNameSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings appropriately', () => {
      // Optional email allows empty string
      expect(emailSchema.safeParse('').success).toBe(true);
      
      // Required email rejects empty string
      expect(requiredEmailSchema.safeParse('').success).toBe(false);
      
      // Optional phone allows undefined
      expect(phoneSchema.safeParse(undefined).success).toBe(true);
    });

    it('should handle boundary values', () => {
      // Amount at max boundary
      expect(amountSchema.safeParse(999999999).success).toBe(true);
      expect(amountSchema.safeParse(1000000000).success).toBe(false);
      
      // Amount at min boundary
      expect(amountSchema.safeParse(0).success).toBe(true);
      expect(amountSchema.safeParse(-0.01).success).toBe(false);
    });

    it('should handle special characters in names', () => {
      // Turkish characters should be allowed
      expect(turkishNameSchema.safeParse('Çağrı Öztürk').success).toBe(true);
      expect(turkishNameSchema.safeParse('Şükrü İşçi').success).toBe(true);
      
      // Numbers should not be allowed
      expect(turkishNameSchema.safeParse('Ali123').success).toBe(false);
    });
  });
});
