import { z } from 'zod';
import type { DonationDocument } from '@/types/database';
import { requiredPhoneSchema, phoneSchema } from './shared-validators';

// Kumbara donation creation schema
export const kumbaraCreateSchema = z.object({
  donor_name: z
    .string()
    .min(2, 'Bağışçı adı en az 2 karakter olmalıdır')
    .max(100, 'Bağışçı adı en fazla 100 karakter olabilir'),
  donor_phone: requiredPhoneSchema,
  donor_email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
  amount: z
    .number()
    .refine((val) => !isNaN(val), 'Bağış tutarı bir sayı olmalıdır')
    .min(0.01, "Bağış tutarı 0'dan büyük olmalıdır")
    .max(10000000, "Bağış tutarı 10.000.000'den küçük olmalıdır"),
  currency: z.enum(['TRY', 'USD', 'EUR'] as const),
  donation_type: z
    .string()
    .min(2, 'Bağış türü en az 2 karakter olmalıdır')
    .max(50, 'Bağış türü en fazla 50 karakter olabilir')
    .default('Kumbara'),
  donation_purpose: z
    .string()
    .min(2, 'Bağış amacı en az 2 karakter olmalıdır')
    .max(100, 'Bağış amacı en fazla 100 karakter olabilir')
    .default('Kumbara Bağışı'),
  payment_method: z
    .string()
    .min(2, 'Ödeme yöntemi en az 2 karakter olmalıdır')
    .max(50, 'Ödeme yöntemi en fazla 50 karakter olabilir')
    .default('Nakit'),
  notes: z.string().max(500, 'Notlar en fazla 500 karakter olabilir').optional(),
  receipt_number: z
    .string()
    .min(3, 'Makbuz numarası en az 3 karakter olmalıdır')
    .max(50, 'Makbuz numarası en fazla 50 karakter olabilir'),
  receipt_file_id: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  // Kumbara-specific fields
  kumbara_location: z
    .string()
    .min(2, 'Kumbara lokasyonu en az 2 karakter olmalıdır')
    .max(100, 'Kumbara lokasyonu en fazla 100 karakter olabilir'),
  kumbara_institution: z
    .string()
    .min(2, 'Kumbara kurum/adres en az 2 karakter olmalıdır')
    .max(200, 'Kumbara kurum/adres en fazla 200 karakter olabilir'),
  collection_date: z
    .string()
    .min(1, 'Toplama tarihi gereklidir')
    .refine((date) => !isNaN(Date.parse(date)), 'Geçerli bir tarih giriniz'),
  is_kumbara: z.boolean().default(true),
  // Map location data
  location_coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  location_address: z.string().optional(),
  route_points: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      })
    )
    .optional(),
  route_distance: z.number().optional(),
  route_duration: z.number().optional(),
});

// Kumbara donation update schema
export const kumbaraUpdateSchema = kumbaraCreateSchema
  .partial()
  .omit({
    donor_name: true,
    donor_phone: true,
    donor_email: true,
    currency: true,
    donation_type: true,
    is_kumbara: true,
  })
  .extend({
    // Status can only be updated
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  });

// Location schema for location management
export const kumbaraLocationSchema = z.object({
  name: z
    .string()
    .min(2, 'Lokasyon adı en az 2 karakter olmalıdır')
    .max(100, 'Lokasyon adı en fazla 100 karakter olabilir'),
  institution: z
    .string()
    .min(2, 'Kurum/adres en az 2 karakter olmalıdır')
    .max(200, 'Kurum/adres en fazla 200 karakter olabilir'),
  city: z
    .string()
    .min(2, 'İl en az 2 karakter olmalıdır')
    .max(50, 'İl en fazla 50 karakter olabilir'),
  district: z
    .string()
    .min(2, 'İlçe en az 2 karakter olmalıdır')
    .max(50, 'İlçe en fazla 50 karakter olabilir'),
  address: z
    .string()
    .min(5, 'Adres en az 5 karakter olmalıdır')
    .max(300, 'Adres en fazla 300 karakter olabilir')
    .optional(),
  contact_person: z.string().max(100, 'İletişim kişisi en fazla 100 karakter olabilir').optional(),
  contact_phone: phoneSchema.or(z.literal('')),
  is_active: z.boolean().default(true),
});

// Filter schema for list queries
export const kumbaraFilterSchema = z.object({
  location: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  currency: z.enum(['TRY', 'USD', 'EUR']).optional(),
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Geçerli bir başlangıç tarihi giriniz')
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Geçerli bir bitiş tarihi giriniz')
    .optional(),
  search: z.string().max(100, 'Arama terimi en fazla 100 karakter olabilir').optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Sayfa numarası 0'dan büyük olmalıdır")
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit 1-100 arasında olmalıdır')
    .optional(),
});

// Export types
export type KumbaraCreateInput = z.infer<typeof kumbaraCreateSchema>;
export type KumbaraUpdateInput = z.infer<typeof kumbaraUpdateSchema>;
export type KumbaraLocationInput = z.infer<typeof kumbaraLocationSchema>;
export type KumbaraFilterInput = z.infer<typeof kumbaraFilterSchema>;

// Type for API response
export interface KumbaraDonationResponse {
  success: boolean;
  data?: Partial<DonationDocument>;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper function to validate kumbara donation
export function validateKumbaraCreate(data: unknown): {
  success: boolean;
  data?: KumbaraCreateInput;
  error?: string;
  errors?: string[];
} {
  const result = kumbaraCreateSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: 'Doğrulama hatası',
      errors: result.error.issues.map((err) => err.message),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// Helper function to validate kumbara update
export function validateKumbaraUpdate(data: unknown): {
  success: boolean;
  data?: KumbaraUpdateInput;
  error?: string;
  errors?: string[];
} {
  const result = kumbaraUpdateSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: 'Doğrulama hatası',
      errors: result.error.issues.map((err) => err.message),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
