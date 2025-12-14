/**
 * Shared Validators Tests
 */

import { describe, it, expect } from 'vitest';
import {
    turkishNameSchema,
    fullNameSchema,
    tcKimlikNoSchema,
    phoneSchema,
    requiredPhoneSchema,
    emailSchema,
    requiredEmailSchema,
    futureDateSchema,
    dateStringSchema,
    addressSchema,
    requiredAddressSchema,
    citySchema,
    districtSchema,
    positiveNumberSchema,
    positiveIntegerSchema,
    familySizeSchema,
    amountSchema,
    shortTextSchema,
    mediumTextSchema,
    longTextSchema,
    notesSchema,
    fileNumberSchema,
    passwordSchema,
    weakPasswordSchema,
    optionalStringSchema,
    requiredStringSchema,
    booleanSchema,
    nationalitySchema,
    calculateAge,
    makeOptional,
    makeRequired,
} from '@/lib/validations/shared-validators';
import { z } from 'zod';

describe('Shared Validators', () => {
    describe('turkishNameSchema', () => {
        it('should accept valid Turkish names', () => {
            expect(turkishNameSchema.safeParse('Ahmet').success).toBe(true);
            expect(turkishNameSchema.safeParse('Şükrü').success).toBe(true);
            expect(turkishNameSchema.safeParse('İsmail').success).toBe(true);
            expect(turkishNameSchema.safeParse('Ömer Faruk').success).toBe(true);
        });

        it('should reject invalid names', () => {
            expect(turkishNameSchema.safeParse('A').success).toBe(false); // Too short
            expect(turkishNameSchema.safeParse('123').success).toBe(false); // Numbers
            expect(turkishNameSchema.safeParse('Test@Name').success).toBe(false); // Special chars
        });
    });

    describe('fullNameSchema', () => {
        it('should accept valid full names', () => {
            expect(fullNameSchema.safeParse('Ahmet Yılmaz').success).toBe(true);
            expect(fullNameSchema.safeParse('Mehmet Ali Öztürk').success).toBe(true);
        });

        it('should reject short names', () => {
            expect(fullNameSchema.safeParse('Ali').success).toBe(false);
        });
    });

    describe('tcKimlikNoSchema', () => {
        it('should accept valid TC Kimlik No', () => {
            // Valid TC numbers (algorithm-compliant)
            expect(tcKimlikNoSchema.safeParse('10000000146').success).toBe(true);
        });

        it('should reject invalid TC Kimlik No', () => {
            expect(tcKimlikNoSchema.safeParse('00000000000').success).toBe(false); // Starts with 0
            expect(tcKimlikNoSchema.safeParse('12345678901').success).toBe(false); // Invalid checksum
            expect(tcKimlikNoSchema.safeParse('1234567890').success).toBe(false); // Too short
            expect(tcKimlikNoSchema.safeParse('123456789012').success).toBe(false); // Too long
            expect(tcKimlikNoSchema.safeParse('1234567890a').success).toBe(false); // Contains letter
        });
    });

    describe('phoneSchema', () => {
        it('should accept valid phone numbers', () => {
            const result1 = phoneSchema.safeParse('5551234567');
            expect(result1.success).toBe(true);
            
            const result2 = phoneSchema.safeParse('05551234567');
            expect(result2.success).toBe(true);
            
            const result3 = phoneSchema.safeParse('+905551234567');
            expect(result3.success).toBe(true);
            
            const result4 = phoneSchema.safeParse('555 123 45 67');
            expect(result4.success).toBe(true);
        });

        it('should accept empty/undefined', () => {
            expect(phoneSchema.safeParse(undefined).success).toBe(true);
            expect(phoneSchema.safeParse('').success).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            const result = phoneSchema.safeParse('1234567890');
            expect(result.success).toBe(false); // Doesn't start with 5
        });
    });

    describe('requiredPhoneSchema', () => {
        it('should accept valid phone numbers', () => {
            const result = requiredPhoneSchema.safeParse('5551234567');
            expect(result.success).toBe(true);
        });

        it('should reject empty values', () => {
            expect(requiredPhoneSchema.safeParse('').success).toBe(false);
        });
    });

    describe('emailSchema', () => {
        it('should accept valid emails', () => {
            expect(emailSchema.safeParse('test@example.com').success).toBe(true);
            expect(emailSchema.safeParse('user.name@domain.co.uk').success).toBe(true);
        });

        it('should accept empty values', () => {
            expect(emailSchema.safeParse('').success).toBe(true);
            expect(emailSchema.safeParse(undefined).success).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(emailSchema.safeParse('invalid-email').success).toBe(false);
            expect(emailSchema.safeParse('test@').success).toBe(false);
        });
    });

    describe('requiredEmailSchema', () => {
        it('should accept valid emails', () => {
            expect(requiredEmailSchema.safeParse('test@example.com').success).toBe(true);
        });

        it('should reject empty values', () => {
            expect(requiredEmailSchema.safeParse('').success).toBe(false);
        });
    });

    describe('futureDateSchema', () => {
        it('should accept future dates', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            expect(futureDateSchema.safeParse(futureDate.toISOString().split('T')[0]).success).toBe(true);
        });

        it('should accept today', () => {
            const today = new Date().toISOString().split('T')[0];
            expect(futureDateSchema.safeParse(today).success).toBe(true);
        });

        it('should accept empty values', () => {
            expect(futureDateSchema.safeParse('').success).toBe(true);
            expect(futureDateSchema.safeParse(undefined).success).toBe(true);
        });

        it('should reject past dates', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);
            expect(futureDateSchema.safeParse(pastDate.toISOString().split('T')[0]).success).toBe(false);
        });
    });

    describe('dateStringSchema', () => {
        it('should accept valid date strings', () => {
            expect(dateStringSchema.safeParse('2024-01-15').success).toBe(true);
            expect(dateStringSchema.safeParse('2025-12-31').success).toBe(true);
        });

        it('should reject invalid date formats', () => {
            expect(dateStringSchema.safeParse('15-01-2024').success).toBe(false);
            expect(dateStringSchema.safeParse('2024/01/15').success).toBe(false);
        });
    });

    describe('addressSchema', () => {
        it('should accept valid addresses', () => {
            expect(addressSchema.safeParse('Atatürk Caddesi No:123 Daire:5').success).toBe(true);
        });

        it('should reject short addresses', () => {
            expect(addressSchema.safeParse('Short').success).toBe(false);
        });

        it('should accept undefined', () => {
            expect(addressSchema.safeParse(undefined).success).toBe(true);
        });
    });

    describe('requiredAddressSchema', () => {
        it('should accept valid addresses', () => {
            expect(requiredAddressSchema.safeParse('Atatürk Caddesi No:123 Daire:5').success).toBe(true);
        });

        it('should reject short addresses', () => {
            expect(requiredAddressSchema.safeParse('Short').success).toBe(false);
        });
    });

    describe('citySchema', () => {
        it('should accept valid city names', () => {
            expect(citySchema.safeParse('İstanbul').success).toBe(true);
            expect(citySchema.safeParse('Ankara').success).toBe(true);
        });

        it('should reject short names', () => {
            expect(citySchema.safeParse('A').success).toBe(false);
        });
    });

    describe('districtSchema', () => {
        it('should accept valid district names', () => {
            expect(districtSchema.safeParse('Kadıköy').success).toBe(true);
        });

        it('should accept undefined', () => {
            expect(districtSchema.safeParse(undefined).success).toBe(true);
        });
    });

    describe('positiveNumberSchema', () => {
        it('should accept positive numbers', () => {
            expect(positiveNumberSchema.safeParse(0).success).toBe(true);
            expect(positiveNumberSchema.safeParse(100).success).toBe(true);
        });

        it('should reject negative numbers', () => {
            expect(positiveNumberSchema.safeParse(-1).success).toBe(false);
        });
    });

    describe('positiveIntegerSchema', () => {
        it('should accept positive integers', () => {
            expect(positiveIntegerSchema.safeParse(0).success).toBe(true);
            expect(positiveIntegerSchema.safeParse(100).success).toBe(true);
        });

        it('should reject decimals', () => {
            expect(positiveIntegerSchema.safeParse(1.5).success).toBe(false);
        });
    });

    describe('familySizeSchema', () => {
        it('should accept valid family sizes', () => {
            expect(familySizeSchema.safeParse(1).success).toBe(true);
            expect(familySizeSchema.safeParse(5).success).toBe(true);
            expect(familySizeSchema.safeParse(20).success).toBe(true);
        });

        it('should reject invalid family sizes', () => {
            expect(familySizeSchema.safeParse(0).success).toBe(false);
            expect(familySizeSchema.safeParse(21).success).toBe(false);
        });
    });

    describe('amountSchema', () => {
        it('should accept valid amounts', () => {
            expect(amountSchema.safeParse(0).success).toBe(true);
            expect(amountSchema.safeParse(1000.50).success).toBe(true);
        });

        it('should reject negative amounts', () => {
            expect(amountSchema.safeParse(-100).success).toBe(false);
        });

        it('should reject too large amounts', () => {
            expect(amountSchema.safeParse(9999999999).success).toBe(false);
        });
    });

    describe('text schemas', () => {
        it('shortTextSchema should accept valid text', () => {
            expect(shortTextSchema.safeParse('Test').success).toBe(true);
        });

        it('mediumTextSchema should accept valid text', () => {
            expect(mediumTextSchema.safeParse('Test description').success).toBe(true);
        });

        it('longTextSchema should accept valid text', () => {
            expect(longTextSchema.safeParse('Long text content').success).toBe(true);
        });

        it('notesSchema should accept valid notes', () => {
            expect(notesSchema.safeParse('Some notes here').success).toBe(true);
        });
    });

    describe('fileNumberSchema', () => {
        it('should accept valid file numbers', () => {
            expect(fileNumberSchema.safeParse('ABC123').success).toBe(true);
            expect(fileNumberSchema.safeParse('FILE001').success).toBe(true);
        });

        it('should reject lowercase', () => {
            expect(fileNumberSchema.safeParse('abc123').success).toBe(false);
        });

        it('should reject special characters', () => {
            expect(fileNumberSchema.safeParse('ABC-123').success).toBe(false);
        });
    });

    describe('passwordSchema', () => {
        it('should accept strong passwords', () => {
            expect(passwordSchema.safeParse('Test@123').success).toBe(true);
            expect(passwordSchema.safeParse('SecureP@ss1').success).toBe(true);
        });

        it('should reject weak passwords', () => {
            expect(passwordSchema.safeParse('short').success).toBe(false);
            expect(passwordSchema.safeParse('nouppercase1!').success).toBe(false);
            expect(passwordSchema.safeParse('NOLOWERCASE1!').success).toBe(false);
            expect(passwordSchema.safeParse('NoNumbers!').success).toBe(false);
            expect(passwordSchema.safeParse('NoSpecial1').success).toBe(false);
        });
    });

    describe('weakPasswordSchema', () => {
        it('should accept weak passwords', () => {
            expect(weakPasswordSchema.safeParse('simple').success).toBe(true);
        });

        it('should reject too short passwords', () => {
            expect(weakPasswordSchema.safeParse('short').success).toBe(false);
        });
    });

    describe('optionalStringSchema', () => {
        it('should accept strings and empty values', () => {
            expect(optionalStringSchema.safeParse('test').success).toBe(true);
            expect(optionalStringSchema.safeParse('').success).toBe(true);
            expect(optionalStringSchema.safeParse(undefined).success).toBe(true);
        });
    });

    describe('requiredStringSchema', () => {
        it('should accept non-empty strings', () => {
            expect(requiredStringSchema.safeParse('test').success).toBe(true);
        });

        it('should reject empty strings', () => {
            expect(requiredStringSchema.safeParse('').success).toBe(false);
        });
    });

    describe('booleanSchema', () => {
        it('should create boolean schema with default', () => {
            const schema = booleanSchema(true);
            expect(schema.parse(undefined)).toBe(true);
            expect(schema.parse(false)).toBe(false);
        });
    });

    describe('nationalitySchema', () => {
        it('should accept valid nationalities', () => {
            expect(nationalitySchema.safeParse('Türk').success).toBe(true);
            expect(nationalitySchema.safeParse('Turkish').success).toBe(true);
        });

        it('should reject short values', () => {
            expect(nationalitySchema.safeParse('T').success).toBe(false);
        });
    });

    describe('calculateAge', () => {
        it('should calculate age correctly', () => {
            const today = new Date();
            const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
            expect(calculateAge(birthDate)).toBe(25);
        });

        it('should handle birthday not yet passed this year', () => {
            const today = new Date();
            const birthDate = new Date(today.getFullYear() - 25, today.getMonth() + 1, today.getDate());
            expect(calculateAge(birthDate)).toBe(24);
        });

        it('should handle same month but day not passed', () => {
            const today = new Date();
            const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate() + 1);
            expect(calculateAge(birthDate)).toBe(24);
        });
    });

    describe('makeOptional', () => {
        it('should make schema optional', () => {
            const requiredSchema = z.string().min(1);
            const optionalSchema = makeOptional(requiredSchema);
            expect(optionalSchema.safeParse(undefined).success).toBe(true);
        });
    });

    describe('makeRequired', () => {
        it('should make schema required', () => {
            const optionalSchema = z.string().optional();
            const requiredSchema = makeRequired(optionalSchema);
            expect(requiredSchema.safeParse('').success).toBe(false);
            expect(requiredSchema.safeParse(undefined).success).toBe(false);
            expect(requiredSchema.safeParse(null).success).toBe(false);
        });
    });
});
