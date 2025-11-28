/**
 * Shared Atomic Field Validators
 * Reusable validation primitives to reduce duplication across schemas
 */

import { z } from 'zod';

// ============================================================================
// NAME VALIDATORS
// ============================================================================

/**
 * Turkish name validator (allows Turkish characters)
 */
export const turkishNameSchema = z
  .string()
  .min(2, 'Ad en az 2 karakter olmalıdır')
  .max(50, 'Ad en fazla 50 karakter olmalıdır')
  .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Sadece harf içerebilir');

/**
 * First name validator
 */
export const firstNameSchema = turkishNameSchema;

/**
 * Last name validator
 */
export const lastNameSchema = turkishNameSchema;

/**
 * Full name validator (combined first + last)
 */
export const fullNameSchema = z
  .string()
  .min(5, 'İsim en az 5 karakter olmalıdır')
  .max(100, 'İsim en fazla 100 karakter olmalıdır')
  .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Sadece harf içerebilir');

// ============================================================================
// TC KIMLIK NO VALIDATOR
// ============================================================================

/**
 * TC Kimlik No validator with algorithm check
 */
export const tcKimlikNoSchema = z
  .string()
  .length(11, 'TC Kimlik No 11 haneli olmalıdır')
  .regex(/^\d{11}$/, 'TC Kimlik No sadece rakam içermelidir')
  .refine((value) => {
    // İlk hane 0 olamaz
    if (value[0] === '0') return false;

    // TC Kimlik No algoritma kontrolü
    const digits = value.split('').map(Number);

    // 10. hane kontrolü: (1,3,5,7,9. hanelerin toplamı * 7 - 2,4,6,8. hanelerin toplamı) % 10
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = (oddSum * 7 - evenSum) % 10;

    if (digits[9] !== check10) return false;

    // 11. hane kontrolü: (İlk 10 hanenin toplamı) % 10
    const sum10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
    const check11 = sum10 % 10;

    return digits[10] === check11;
  }, 'Geçersiz TC Kimlik No');

// ============================================================================
// PHONE VALIDATORS
// ============================================================================

/**
 * Turkish mobile phone validator
 * Accepts: 5XXXXXXXXX (10 digits, Turkish mobile format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^5\d{9}$/,
    'Telefon numarası 10 haneli olmalı ve 5 ile başlamalıdır (5XXXXXXXXX)'
  )
  .optional();

/**
 * Required phone validator
 * Accepts: 5XXXXXXXXX (10 digits, Turkish mobile format)
 */
export const requiredPhoneSchema = z
  .string()
  .min(10, 'Telefon numarası gereklidir')
  .regex(/^5\d{9}$/, 'Telefon numarası 10 haneli olmalı ve 5 ile başlamalıdır (5XXXXXXXXX)');

/**
 * International phone validator
 */
export const internationalPhoneSchema = z
  .string()
  .regex(/^\+\d{10,15}$/, 'Geçerli bir uluslararası telefon numarası girin')
  .optional();

// ============================================================================
// EMAIL VALIDATOR
// ============================================================================

/**
 * Email validator
 */
export const emailSchema = z
  .string()
  .email('Geçerli bir email adresi giriniz')
  .optional()
  .or(z.literal(''));

/**
 * Required email validator
 */
export const requiredEmailSchema = z
  .string()
  .min(1, 'Email adresi gereklidir')
  .email('Geçerli bir email adresi giriniz');

// ============================================================================
// DATE VALIDATORS
// ============================================================================

/**
 * Past date validator (for birth dates, etc.)
 */
export const pastDateSchema = z
  .date()
  .refine((date) => date <= new Date(), 'Geçmiş bir tarih seçiniz')
  .optional();

/**
 * Future date validator (for due dates, etc.)
 */
export const futureDateSchema = z
  .string()
  .refine((dateStr) => {
    if (!dateStr) return true; // Optional field
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Bugün veya gelecek bir tarih seçiniz')
  .optional();

/**
 * Date string validator (ISO format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli tarih formatı: YYYY-MM-DD')
  .optional();

// ============================================================================
// ADDRESS VALIDATORS
// ============================================================================

/**
 * Street address validator
 */
export const addressSchema = z
  .string()
  .min(10, 'Adres en az 10 karakter olmalıdır')
  .max(500, 'Adres en fazla 500 karakter olmalıdır')
  .optional();

/**
 * Required address validator
 */
export const requiredAddressSchema = z
  .string()
  .min(10, 'Adres en az 10 karakter olmalıdır')
  .max(500, 'Adres en fazla 500 karakter olmalıdır');

/**
 * City validator
 */
export const citySchema = z
  .string()
  .min(2, 'Şehir adı girin')
  .max(50, 'Şehir adı en fazla 50 karakter olmalıdır');

/**
 * District validator
 */
export const districtSchema = z
  .string()
  .min(2, 'İlçe adı girin')
  .max(100, 'İlçe adı en fazla 100 karakter olmalıdır')
  .optional();

/**
 * Neighborhood validator
 */
export const neighborhoodSchema = z
  .string()
  .min(2, 'Mahalle adı girin')
  .max(100, 'Mahalle adı en fazla 100 karakter olmalıdır')
  .optional();

// ============================================================================
// NUMERIC VALIDATORS
// ============================================================================

/**
 * Positive number validator
 */
export const positiveNumberSchema = z.number().min(0, 'Değer negatif olamaz');

/**
 * Positive integer validator
 */
export const positiveIntegerSchema = z
  .number()
  .int('Tam sayı olmalıdır')
  .min(0, 'Değer negatif olamaz');

/**
 * Family size validator
 */
export const familySizeSchema = z
  .number()
  .int('Tam sayı olmalıdır')
  .min(1, 'Aile büyüklüğü en az 1 olmalıdır')
  .max(20, 'Aile büyüklüğü en fazla 20 olmalıdır')
  .optional();

/**
 * Amount/money validator
 */
export const amountSchema = z
  .number()
  .min(0, 'Tutar negatif olamaz')
  .max(999999999, 'Tutar çok büyük');

// ============================================================================
// TEXT VALIDATORS
// ============================================================================

/**
 * Short text validator (for titles, labels)
 */
export const shortTextSchema = z
  .string()
  .min(1, 'Bu alan boş olamaz')
  .max(100, 'En fazla 100 karakter olmalıdır')
  .optional();

/**
 * Medium text validator (for descriptions)
 */
export const mediumTextSchema = z
  .string()
  .min(1, 'Bu alan boş olamaz')
  .max(500, 'En fazla 500 karakter olmalıdır')
  .optional();

/**
 * Long text validator (for notes, comments)
 */
export const longTextSchema = z.string().max(1000, 'En fazla 1000 karakter olmalıdır').optional();

/**
 * Notes validator
 */
export const notesSchema = z
  .string()
  .max(2000, 'Notlar en fazla 2000 karakter olmalıdır')
  .optional();

// ============================================================================
// FILE NUMBER VALIDATORS
// ============================================================================

/**
 * File number validator (uppercase alphanumeric)
 */
export const fileNumberSchema = z
  .string()
  .min(1, 'Dosya numarası zorunludur')
  .max(20, 'Dosya numarası en fazla 20 karakter olmalıdır')
  .regex(/^[A-Z0-9]+$/, 'Dosya numarası sadece büyük harf ve rakam içerebilir');

// ============================================================================
// PASSWORD VALIDATORS
// ============================================================================

/**
 * Password strength validator
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalıdır')
  .max(100, 'Şifre en fazla 100 karakter olmalıdır')
  .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
  .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
  .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir')
  .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermelidir');

/**
 * Weak password validator (for migration/legacy support)
 */
export const weakPasswordSchema = z
  .string()
  .min(6, 'Şifre en az 6 karakter olmalıdır')
  .max(100, 'Şifre en fazla 100 karakter olmalıdır');

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

/**
 * Optional string that can be empty
 */
export const optionalStringSchema = z.string().optional().or(z.literal(''));

/**
 * Required non-empty string
 */
export const requiredStringSchema = z.string().min(1, 'Bu alan zorunludur');

/**
 * Boolean with default
 */
export const booleanSchema = (defaultValue: boolean = false) => z.boolean().default(defaultValue);

/**
 * Nationality validator
 */
export const nationalitySchema = z
  .string()
  .min(2, 'Uyruk en az 2 karakter olmalıdır')
  .max(50, 'Uyruk en fazla 50 karakter olmalıdır');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Create optional version of any schema
 */
export const makeOptional = <T extends z.ZodTypeAny>(schema: T) => schema.optional();

/**
 * Create required version of any schema
 */
export const makeRequired = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine((val) => val !== undefined && val !== null && val !== '', {
    message: 'Bu alan zorunludur',
  });
