// KafkasDer Partner (Ortak/Sponsor) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";
import { phoneSchema } from "./shared-validators";

// === PARTNER TYPE ENUMS ===

export const partnerTypeValues = [
  "organization",
  "individual",
  "sponsor",
] as const;
export const partnershipTypeValues = [
  "donor",
  "supplier",
  "volunteer",
  "sponsor",
  "service_provider",
] as const;
export const partnerStatusValues = ["active", "inactive", "pending"] as const;

// === PARTNER VALIDATION SCHEMAS ===

/**
 * Base partner schema
 */
export const partnerBaseSchema = z.object({
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(200, "İsim en fazla 200 karakter olabilir")
    .trim(),

  type: z.enum(partnerTypeValues, {
    message: "Geçersiz ortak tipi",
  }),

  partnership_type: z.enum(partnershipTypeValues, {
    message: "Geçersiz ortaklık tipi",
  }),

  status: z
    .enum(partnerStatusValues, {
      message: "Geçersiz durum",
    })
    .default("pending"),

  contact_person: z
    .string()
    .min(2, "İletişim kişisi adı en az 2 karakter olmalıdır")
    .max(100, "İletişim kişisi adı en fazla 100 karakter olabilir")
    .trim()
    .optional(),

  email: z
    .string()
    .email("Geçerli bir email adresi giriniz")
    .max(255, "Email en fazla 255 karakter olabilir")
    .toLowerCase()
    .trim()
    .optional(),

  phone: phoneSchema.optional(),

  address: z
    .string()
    .min(10, "Adres en az 10 karakter olmalıdır")
    .max(500, "Adres en fazla 500 karakter olabilir")
    .trim()
    .optional(),

  website: z
    .string()
    .url("Geçerli bir web sitesi URL'i giriniz")
    .max(500, "Web sitesi URL'i çok uzun")
    .optional()
    .or(z.literal("")),

  tax_number: z
    .string()
    .regex(/^\d{10,11}$/, "Vergi numarası 10 veya 11 haneli olmalıdır")
    .optional()
    .or(z.literal("")),

  collaboration_start_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz işbirliği başlangıç tarihi formatı" },
    )
    .optional(),

  collaboration_end_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz işbirliği bitiş tarihi formatı" },
    )
    .optional(),

  notes: z
    .string()
    .max(2000, "Notlar en fazla 2000 karakter olabilir")
    .optional(),

  total_contribution: z
    .number()
    .nonnegative("Toplam katkı negatif olamaz")
    .max(9999999999, "Toplam katkı çok yüksek")
    .optional(),

  contribution_count: z
    .number()
    .int("Katkı sayısı tam sayı olmalıdır")
    .nonnegative("Katkı sayısı negatif olamaz")
    .max(999999, "Katkı sayısı çok yüksek")
    .optional(),

  logo_url: z
    .string()
    .url("Geçerli bir logo URL'i giriniz")
    .max(500, "Logo URL'i çok uzun")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for creating new partner
 */
export const partnerCreateSchema = partnerBaseSchema.refine(
  (data) => {
    if (data.collaboration_start_date && data.collaboration_end_date) {
      return (
        new Date(data.collaboration_start_date) <
        new Date(data.collaboration_end_date)
      );
    }
    return true;
  },
  {
    message: "İşbirliği başlangıç tarihi bitiş tarihinden önce olmalıdır",
    path: ["collaboration_end_date"],
  },
);

/**
 * Schema for updating partner
 */
export const partnerUpdateSchema = partnerBaseSchema.partial().refine(
  (data) => {
    if (data.collaboration_start_date && data.collaboration_end_date) {
      return (
        new Date(data.collaboration_start_date) <
        new Date(data.collaboration_end_date)
      );
    }
    return true;
  },
  {
    message: "İşbirliği başlangıç tarihi bitiş tarihinden önce olmalıdır",
    path: ["collaboration_end_date"],
  },
);

/**
 * Type inference from schemas
 */
export type PartnerCreateInput = z.infer<typeof partnerCreateSchema>;
export type PartnerUpdateInput = z.infer<typeof partnerUpdateSchema>;
