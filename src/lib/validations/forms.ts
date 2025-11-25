/**
 * Form Validation Schemas
 * Zod schemas for form validation across the application
 */

import { z } from 'zod';
import { requiredPhoneSchema } from './shared-validators';

/**
 * Donation Form Schema
 */
export const donationSchema = z.object({
  donor_name: z.string().min(2, 'Donör adı en az 2 karakter olmalıdır'),
  donor_phone: requiredPhoneSchema,
  donor_email: z.string().email('Geçerli bir email adresi girin').optional().or(z.literal('')),
  amount: z.number().min(1, "Tutar 0'dan büyük olmalıdır"),
  currency: z.enum(['TRY', 'USD', 'EUR']),
  donation_type: z.string().min(2, 'Bağış türü belirtin'),
  payment_method: z.string().min(2, 'Ödeme yöntemi belirtin'),
  donation_purpose: z.string().min(2, 'Bağış amacı belirtin'),
  receipt_number: z.string().min(1, 'Makbuz numarası zorunludur'),
  notes: z.string().optional(),
  receipt_file_id: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']),
});

export type DonationFormData = z.infer<typeof donationSchema>;

/**
 * Beneficiary Form Schema (example - can be expanded)
 */
export const beneficiarySchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  tc_no: z.string().length(11, 'TC kimlik numarası 11 haneli olmalıdır'),
  phone: requiredPhoneSchema,
  email: z.string().email('Geçerli bir email adresi girin').optional().or(z.literal('')),
  address: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
  city: z.string().min(2, 'Şehir seçin'),
  district: z.string().min(2, 'İlçe seçin'),
  neighborhood: z.string().min(2, 'Mahalle girin'),
  family_size: z.number().min(1, 'Aile birey sayısı en az 1 olmalıdır'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  category: z.string().optional(),
});

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

/**
 * Task Form Schema (example - can be expanded)
 */
export const taskSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().optional(),
  assigned_to: z.string().min(1, 'Atanan kişi seçin'),
  created_by: z.string().min(1, 'Oluşturan kişi gerekli'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed']),
  due_date: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
