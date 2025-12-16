import { z } from 'zod';
import { tcKimlikNoLenientSchema, turkishNameSchema, requiredPhoneSchema } from './shared-validators';

export const studentFormSchema = z.object({
  applicant_name: turkishNameSchema,
  applicant_tc_no: tcKimlikNoLenientSchema,
  applicant_phone: requiredPhoneSchema,
  applicant_email: z
    .union([z.literal(''), z.string().email('Geçerli bir e-posta adresi giriniz')])
    .optional(),
  university: z.string().min(2, 'Üniversite adı gereklidir'),
  department: z.string().min(2, 'Bölüm adı gereklidir'),
  grade_level: z.string().min(1, 'Sınıf seçimi gereklidir'),
  gpa: z.coerce.number().min(0).max(4).optional(),
  scholarship_id: z.string().min(1, 'Burs programı seçimi gereklidir'),
  monthly_income: z.coerce.number().min(0).optional(),
  family_income: z.coerce.number().min(0).optional(),
  father_occupation: z.string().optional(),
  mother_occupation: z.string().optional(),
  sibling_count: z.coerce.number().min(0).optional(),
  is_orphan: z.boolean(),
  has_disability: z.boolean(),
  essay: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
