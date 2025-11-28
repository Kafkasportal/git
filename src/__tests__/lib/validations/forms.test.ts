/**
 * Tests for form validation schemas
 * Validates Zod schema definitions work correctly
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define common test schemas
const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z.string().regex(/^\+?[\d\s\-()]{10,}$/, 'Invalid phone format');
const tcNoSchema = z.string().regex(/^\d{11}$/, 'TC No must be 11 digits');

describe('Form Validation Schemas', () => {
  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@example.com',
        'user123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = ['notanemail', 'user@', '@example.com', 'user name@example.com'];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate various phone formats', () => {
      const validPhones = [
        '+905551234567',
        '5551234567',
        '+90 (555) 123-4567',
        '0555 123 45 67',
        '+90-555-1234567',
      ];

      validPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = ['123', '05551', 'abc1234567'];

      invalidPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Turkish ID (TC No) Validation', () => {
    it('should validate 11-digit TC numbers', () => {
      const validTcNos = ['12345678901', '98765432101', '55555555555', '10000000000'];

      validTcNos.forEach((tcNo) => {
        const result = tcNoSchema.safeParse(tcNo);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid TC numbers', () => {
      const invalidTcNos = [
        '1234567890', // 10 digits
        '123456789012', // 12 digits
        '1234567890a', // Contains letter
        '12345-67890', // Contains special char
      ];

      invalidTcNos.forEach((tcNo) => {
        const result = tcNoSchema.safeParse(tcNo);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Complex Schema Validation', () => {
    const beneficiarySchema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: emailSchema.optional(),
      phone: phoneSchema,
      tc_no: tcNoSchema,
      age: z.number().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
      address: z.string().min(10, 'Address must be at least 10 characters'),
    });

    it('should validate complete beneficiary object', () => {
      const validBeneficiary = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+905551234567',
        tc_no: '12345678901',
        age: 35,
        address: '123 Main Street, Istanbul, Turkey',
      };

      const result = beneficiarySchema.safeParse(validBeneficiary);
      expect(result.success).toBe(true);
    });

    it('should validate beneficiary without optional email', () => {
      const beneficiaryNoEmail = {
        name: 'Jane Doe',
        phone: '+905551234567',
        tc_no: '98765432101',
        age: 28,
        address: '456 Oak Avenue, Ankara, Turkey',
      };

      const result = beneficiarySchema.safeParse(beneficiaryNoEmail);
      expect(result.success).toBe(true);
    });

    it('should reject invalid beneficiary object', () => {
      const invalidBeneficiary = {
        name: 'J', // Too short
        email: 'not-an-email', // Invalid email
        phone: '123', // Too short
        tc_no: '123', // Not 11 digits
        age: 15, // Too young
        address: '123', // Too short
      };

      const result = beneficiarySchema.safeParse(invalidBeneficiary);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should provide specific error messages', () => {
      const invalidBeneficiary = {
        name: 'J',
        phone: '123',
        tc_no: '123',
        age: 15,
        address: '123',
      };

      const result = beneficiarySchema.safeParse(invalidBeneficiary);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errors = result.error.issues;
        expect(errors.some((e: any) => e.code === 'too_small')).toBe(true);
        expect(errors.some((e: any) => e.code === 'invalid_format')).toBe(true);
      }
    });
  });

  describe('String Transformations', () => {
    const trimmedStringSchema = z.string().trim().min(1, 'Required');

    it('should trim whitespace from input', () => {
      const inputs = ['  hello  ', '\nworld\n', '\t\ttest\t\t'];

      inputs.forEach((input) => {
        const result = trimmedStringSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toMatch(/^\s+|\s+$/);
        }
      });
    });
  });

  describe('Conditional Validation', () => {
    const applicationSchema = z
      .object({
        applicationType: z.enum(['urgent', 'standard', 'seasonal']),
        description: z.string(),
        urgencyReason: z.string().optional(),
      })
      .refine(
        (data) => {
          // If urgent, urgencyReason is required
          if (data.applicationType === 'urgent') {
            return data.urgencyReason !== undefined && data.urgencyReason.length > 0;
          }
          return true;
        },
        {
          message: 'Urgency reason required for urgent applications',
          path: ['urgencyReason'],
        }
      );

    it('should validate urgent application with reason', () => {
      const urgentApp = {
        applicationType: 'urgent',
        description: 'Urgent aid needed',
        urgencyReason: 'Medical emergency',
      };

      const result = applicationSchema.safeParse(urgentApp);
      expect(result.success).toBe(true);
    });

    it('should reject urgent application without reason', () => {
      const urgentAppNoReason = {
        applicationType: 'urgent',
        description: 'Urgent aid needed',
        urgencyReason: '',
      };

      const result = applicationSchema.safeParse(urgentAppNoReason);
      expect(result.success).toBe(false);
    });

    it('should allow standard application without reason', () => {
      const standardApp = {
        applicationType: 'standard',
        description: 'Standard aid request',
      };

      const result = applicationSchema.safeParse(standardApp);
      expect(result.success).toBe(true);
    });
  });

  describe('Union Types', () => {
    const donationSchema = z.object({
      amount: z.number().positive('Amount must be positive'),
      type: z.enum(['cash', 'check', 'bank_transfer', 'online', 'in_kind']),
      details: z
        .object({
          bankName: z.string(),
          accountNumber: z.string(),
        })
        .optional(),
    });

    it('should validate different donation types', () => {
      const types: Array<'cash' | 'check' | 'bank_transfer' | 'online' | 'in_kind'> = [
        'cash',
        'check',
        'bank_transfer',
        'online',
        'in_kind',
      ];

      types.forEach((type) => {
        const donation = {
          amount: 1000,
          type,
        };

        const result = donationSchema.safeParse(donation);
        expect(result.success).toBe(true);
      });
    });

    it('should allow bank transfer details', () => {
      const bankTransfer = {
        amount: 5000,
        type: 'bank_transfer' as const,
        details: {
          bankName: 'XYZ Bank',
          accountNumber: '1234567890',
        },
      };

      const result = donationSchema.safeParse(bankTransfer);
      expect(result.success).toBe(true);
    });
  });
});
