/**
 * Phone Validation and Sanitization Tests
 * Tests for phone number validation and sanitization functions
 */

import { describe, it, expect } from 'vitest';
import { phoneSchema, requiredPhoneSchema } from '@/lib/validations/shared-validators';
import { sanitizePhone } from '@/lib/sanitization';

describe('Phone Validation', () => {
  describe('phoneSchema', () => {
    it('should accept valid 10-digit phone starting with 5', () => {
      const result = phoneSchema.safeParse('5551234567');
      expect(result.success).toBe(true);
    });

    it('should reject phone with 0 prefix', () => {
      const result = phoneSchema.safeParse('05551234567');
      expect(result.success).toBe(false);
    });

    it('should reject phone with +90 prefix', () => {
      const result = phoneSchema.safeParse('+905551234567');
      expect(result.success).toBe(false);
    });

    it('should reject phone starting with 4 (landline)', () => {
      const result = phoneSchema.safeParse('4551234567');
      expect(result.success).toBe(false);
    });

    it('should reject phone with only 9 digits', () => {
      const result = phoneSchema.safeParse('555123456');
      expect(result.success).toBe(false);
    });

    it('should reject phone with 11 digits', () => {
      const result = phoneSchema.safeParse('55512345678');
      expect(result.success).toBe(false);
    });

    it('should accept undefined/empty for optional schema', () => {
      const result = phoneSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('requiredPhoneSchema', () => {
    it('should accept valid 10-digit phone starting with 5', () => {
      const result = requiredPhoneSchema.safeParse('5551234567');
      expect(result.success).toBe(true);
    });

    it('should reject empty string', () => {
      const result = requiredPhoneSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject undefined', () => {
      const result = requiredPhoneSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizePhone', () => {
    it('should normalize +905551234567 to 5551234567', () => {
      const result = sanitizePhone('+905551234567');
      expect(result).toBe('5551234567');
    });

    it('should normalize 05551234567 to 5551234567', () => {
      const result = sanitizePhone('05551234567');
      expect(result).toBe('5551234567');
    });

    it('should keep 5551234567 unchanged', () => {
      const result = sanitizePhone('5551234567');
      expect(result).toBe('5551234567');
    });

    it('should normalize 905551234567 to 5551234567', () => {
      const result = sanitizePhone('905551234567');
      expect(result).toBe('5551234567');
    });

    it('should normalize +90 555 123 45 67 (with spaces) to 5551234567', () => {
      const result = sanitizePhone('+90 555 123 45 67');
      expect(result).toBe('5551234567');
    });

    it('should reject landline starting with 4', () => {
      const result = sanitizePhone('4551234567');
      expect(result).toBeNull();
    });

    it('should reject too short number', () => {
      const result = sanitizePhone('123');
      expect(result).toBeNull();
    });

    it('should reject number not starting with 5 (after country code removal)', () => {
      const result = sanitizePhone('3551234567');
      expect(result).toBeNull();
    });

    it('should handle empty input', () => {
      const result = sanitizePhone('');
      expect(result).toBeNull();
    });
  });

  describe('Integration: Sanitize + Validate', () => {
    it('should accept sanitized +905551234567 through validation', () => {
      const sanitized = sanitizePhone('+905551234567');
      expect(sanitized).toBe('5551234567');
      
      const validation = phoneSchema.safeParse(sanitized);
      expect(validation.success).toBe(true);
    });

    it('should accept sanitized 05551234567 through validation', () => {
      const sanitized = sanitizePhone('05551234567');
      expect(sanitized).toBe('5551234567');
      
      const validation = phoneSchema.safeParse(sanitized);
      expect(validation.success).toBe(true);
    });

    it('should reject invalid phone even after sanitization', () => {
      const sanitized = sanitizePhone('4551234567'); // Landline
      expect(sanitized).toBeNull();
    });

    it('should complete workflow: user input -> sanitize -> validate', () => {
      // Simulating user entering different formats
      const inputs = ['+905551234567', '05551234567', '5551234567'];
      
      inputs.forEach((input) => {
        const sanitized = sanitizePhone(input);
        expect(sanitized).toBe('5551234567');
        
        const validation = requiredPhoneSchema.safeParse(sanitized);
        expect(validation.success).toBe(true);
      });
    });
  });
});

