/**
 * Beneficiary Form Types and Schema
 * Extracted from the main page for better organization
 */

import { z } from 'zod';

// Form validation schema
export const docSchema = z.object({
  // Personal Information
  name: z.string().min(1, 'Ad gerekli'),
  surname: z.string().min(1, 'Soyad gerekli'),
  tc_no: z
    .string()
    .min(11, 'TC Kimlik No 11 haneli olmalı')
    .max(11, 'TC Kimlik No 11 haneli olmalı'),
  phone: z.string().min(10, 'Telefon numarası gerekli'),
  email: z.string().email('Geçerli e-posta gerekli').optional().or(z.literal('')),

  // Address Information
  address: z.string().min(1, 'Adres gerekli'),
  city: z.string().min(1, 'Şehir gerekli'),
  district: z.string().min(1, 'İlçe gerekli'),
  neighborhood: z.string().min(1, 'Mahalle gerekli'),
  postal_code: z.string().optional(),

  // Demographics
  birth_date: z.string().min(1, 'Doğum tarihi gerekli'),
  gender: z.string().min(1, 'Cinsiyet gerekli'),
  marital_status: z.string().optional(),
  education_status: z.string().optional(),
  occupation: z.string().optional(),

  // Health Information
  blood_type: z.string().optional(),
  chronic_disease: z.string().optional(),
  disease_category: z.string().optional(),
  disability_status: z.string().optional(),
  disability_percentage: z.string().optional(),

  // Contact Information
  contact_preference: z.string().optional(),
});

export type FormValues = z.infer<typeof docSchema>;

// Note: Static data moved to component for simplicity
// Can be re-exported when needed
