/**
 * API Validation Schemas
 *
 * Centralized Zod schemas for API route validation.
 * These schemas consolidate validation logic that was previously duplicated
 * across multiple API route files.
 *
 * NOTE: These are specifically designed for API route validation and may differ
 * from form validation schemas which often have additional UI-specific requirements.
 */

import { z } from 'zod';

// ============================================================================
// PHONE VALIDATION HELPER
// ============================================================================

/**
 * Simple phone validation schema for API routes
 * Accepts Turkish mobile format: 5XXXXXXXXX
 */
const apiPhoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      // Remove all non-digit characters
      const cleaned = val.replace(/\D/g, '');
      // Check if it matches 5XXXXXXXXX pattern
      return /^5\d{9}$/.test(cleaned);
    },
    'Geçersiz telefon numarası (5XXXXXXXXX formatında olmalıdır)'
  );

// ============================================================================
// BENEFICIARY API SCHEMAS
// ============================================================================

/**
 * Beneficiary status enum for API validation
 */
const beneficiaryStatusEnum = z.enum(['TASLAK', 'AKTIF', 'PASIF', 'SILINDI']);

/**
 * Base beneficiary validation schema for API routes
 * Used for creating new beneficiaries
 */
export const beneficiaryApiCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Ad Soyad en az 2 karakter olmalıdır')
    .max(100, 'Ad Soyad en fazla 100 karakter olmalıdır'),
  tc_no: z
    .string()
    .regex(/^\d{11}$/, 'TC Kimlik No 11 haneli olmalıdır'),
  phone: z
    .string()
    .regex(/^[0-9\s\-\+\(\)]{10,15}$/, 'Geçerli bir telefon numarası giriniz'),
  address: z
    .string()
    .min(10, 'Adres en az 10 karakter olmalıdır')
    .max(500, 'Adres en fazla 500 karakter olmalıdır'),
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .optional()
    .or(z.literal('')),
  status: beneficiaryStatusEnum.optional().default('TASLAK'),
  city: z.string().optional(),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  family_size: z.number().min(1).optional().default(1),
  // Optional fields
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  marital_status: z.string().optional(),
  children_count: z.number().min(0).optional(),
  orphan_children_count: z.number().min(0).optional(),
  elderly_count: z.number().min(0).optional(),
  disabled_count: z.number().min(0).optional(),
  income_level: z.string().optional(),
  income_source: z.string().optional(),
  has_debt: z.boolean().optional(),
  housing_type: z.string().optional(),
  has_vehicle: z.boolean().optional(),
  health_status: z.string().optional(),
  has_chronic_illness: z.boolean().optional(),
  chronic_illness_detail: z.string().optional(),
  has_disability: z.boolean().optional(),
  disability_detail: z.string().optional(),
  has_health_insurance: z.boolean().optional(),
  regular_medication: z.string().optional(),
  education_level: z.string().optional(),
  occupation: z.string().optional(),
  employment_status: z.string().optional(),
  aid_type: z.string().optional(),
  totalAidAmount: z.number().min(0).optional(),
  aid_duration: z.string().optional(),
  priority: z.string().optional(),
  reference_name: z.string().optional(),
  reference_phone: z.string().optional(),
  reference_relation: z.string().optional(),
  application_source: z.string().optional(),
  notes: z.string().optional(),
  previous_aid: z.boolean().optional(),
  other_organization_aid: z.string().optional(),
  emergency: z.boolean().optional(),
  contact_preference: z.string().optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  approved_by: z.string().optional(),
  approved_at: z.string().optional(),
});

/**
 * Beneficiary update schema - all fields are optional for partial updates
 */
export const beneficiaryApiUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Ad Soyad en az 2 karakter olmalıdır')
    .max(100, 'Ad Soyad en fazla 100 karakter olmalıdır')
    .optional(),
  tc_no: z
    .string()
    .regex(/^\d{11}$/, 'TC Kimlik No 11 haneli olmalıdır')
    .optional(),
  phone: z
    .string()
    .regex(/^[0-9\s\-\+\(\)]{10,15}$/, 'Geçerli bir telefon numarası giriniz')
    .optional(),
  address: z
    .string()
    .min(10, 'Adres en az 10 karakter olmalıdır')
    .max(500, 'Adres en fazla 500 karakter olmalıdır')
    .optional(),
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .optional()
    .or(z.literal('')),
  status: beneficiaryStatusEnum.optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  family_size: z.number().min(1).optional(),
}).passthrough(); // Allow additional fields for partial updates

// ============================================================================
// DONATION API SCHEMAS
// ============================================================================

/**
 * Donation status enum
 */
const donationStatusEnum = z.enum(['pending', 'completed', 'cancelled']);

/**
 * Currency enum
 */
const currencyEnum = z.enum(['TRY', 'USD', 'EUR']);

/**
 * Donation create schema for API routes
 */
export const donationApiCreateSchema = z.object({
  donor_name: z
    .string()
    .min(2, 'Bağışçı adı en az 2 karakter olmalıdır')
    .max(100, 'Bağışçı adı en fazla 100 karakter olmalıdır'),
  amount: z
    .number()
    .positive('Bağış tutarı pozitif olmalıdır'),
  currency: currencyEnum.default('TRY'),
  donor_email: z
    .string()
    .email('Geçersiz e-posta')
    .optional()
    .or(z.literal('')),
  donor_phone: apiPhoneSchema,
  donation_type: z.string().min(1, 'Bağış türü').optional(),
  payment_method: z.string().optional().default('cash'),
  donation_purpose: z.string().min(1, 'Bağış amacı').optional(),
  receipt_number: z.string().min(1, 'Makbuz numarası').optional(),
  notes: z.string().optional(),
  receipt_file_id: z.string().optional(),
  status: donationStatusEnum.optional().default('pending'),
});

/**
 * Donation update schema - all fields optional for partial updates
 */
export const donationApiUpdateSchema = z.object({
  amount: z
    .number()
    .positive('Bağış tutarı pozitif olmalıdır')
    .optional(),
  currency: currencyEnum.optional(),
  donor_email: z
    .string()
    .email('Geçersiz e-posta')
    .optional()
    .or(z.literal('')),
  donor_phone: apiPhoneSchema,
  status: donationStatusEnum.optional(),
  notes: z.string().optional(),
}).passthrough(); // Allow additional fields for partial updates

// ============================================================================
// MEETING API SCHEMAS
// ============================================================================

/**
 * Meeting status enum
 */
const meetingStatusEnum = z.enum(['scheduled', 'ongoing', 'completed', 'cancelled'], {
  message: 'Geçersiz durum',
});

/**
 * Meeting type enum
 */
const meetingTypeEnum = z.enum(['general', 'committee', 'board', 'other']);

/**
 * Meeting create schema for API routes
 */
export const meetingApiCreateSchema = z.object({
  title: z
    .string({ message: 'Toplantı başlığı gereklidir' })
    .min(3, 'Toplantı başlığı en az 3 karakter olmalıdır')
    .max(200, 'Toplantı başlığı en fazla 200 karakter olmalıdır'),
  meeting_date: z.string({ message: 'Toplantı tarihi zorunludur' }).min(1, 'Toplantı tarihi zorunludur'),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  organizer: z.string().optional(),
  participants: z.array(z.string()).optional().default([]),
  status: meetingStatusEnum.optional().default('scheduled'),
  meeting_type: meetingTypeEnum.optional().default('general'),
  agenda: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Meeting update schema - all fields optional for partial updates
 */
export const meetingApiUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Toplantı başlığı en az 3 karakter olmalıdır')
    .max(200, 'Toplantı başlığı en fazla 200 karakter olmalıdır')
    .optional(),
  meeting_date: z.string().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  organizer: z.string().optional(),
  participants: z.array(z.string()).optional(),
  status: meetingStatusEnum.optional(),
  meeting_type: meetingTypeEnum.optional(),
  agenda: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough(); // Allow additional fields for partial updates

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BeneficiaryApiCreateData = z.infer<typeof beneficiaryApiCreateSchema>;
export type BeneficiaryApiUpdateData = z.infer<typeof beneficiaryApiUpdateSchema>;
export type DonationApiCreateData = z.infer<typeof donationApiCreateSchema>;
export type DonationApiUpdateData = z.infer<typeof donationApiUpdateSchema>;
export type MeetingApiCreateData = z.infer<typeof meetingApiCreateSchema>;
export type MeetingApiUpdateData = z.infer<typeof meetingApiUpdateSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Helper function to validate data with a Zod schema and return a consistent result
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      isValid: true,
      errors: [],
      data: result.data,
    };
  }

  return {
    isValid: false,
    // Return just the error message without path prefix for backward compatibility
    errors: result.error.issues.map((issue) => issue.message),
  };
}
