// KafkasDer Scholarship (Burs) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";
import { tcKimlikNoSchema, turkishNameSchema } from "./shared-validators";

// === SCHOLARSHIP TYPE ENUM ===

export const scholarshipTypeValues = ["monthly", "one-time", "annual"] as const;
export const scholarshipStatusValues = [
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

// === SCHOLARSHIP VALIDATION SCHEMAS ===

/**
 * Base scholarship schema
 */
export const scholarshipBaseSchema = z.object({
  student_name: turkishNameSchema,

  tc_no: tcKimlikNoSchema,

  school_name: z
    .string()
    .min(2, "Okul adı en az 2 karakter olmalıdır")
    .max(200, "Okul adı en fazla 200 karakter olabilir")
    .trim(),

  grade: z
    .number()
    .int("Sınıf tam sayı olmalıdır")
    .min(1, "Sınıf en az 1 olmalıdır")
    .max(12, "Sınıf en fazla 12 olabilir"),

  scholarship_amount: z
    .number()
    .positive("Burs tutarı pozitif olmalıdır")
    .max(999999999, "Burs tutarı çok yüksek"),

  scholarship_type: z.enum(scholarshipTypeValues, {
    message: "Geçersiz burs tipi",
  }),

  start_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz başlangıç tarihi formatı" },
    ),

  end_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz bitiş tarihi formatı" },
    ),

  status: z
    .enum(scholarshipStatusValues, {
      message: "Geçersiz burs durumu",
    })
    .optional()
    .default("active"),
});

/**
 * Schema for creating new scholarship
 */
export const scholarshipCreateSchema = scholarshipBaseSchema.refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) < new Date(data.end_date);
    }
    return true;
  },
  {
    message: "Başlangıç tarihi bitiş tarihinden önce olmalıdır",
    path: ["end_date"],
  },
);

/**
 * Schema for updating scholarship
 */
export const scholarshipUpdateSchema = scholarshipBaseSchema.partial().refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) < new Date(data.end_date);
    }
    return true;
  },
  {
    message: "Başlangıç tarihi bitiş tarihinden önce olmalıdır",
    path: ["end_date"],
  },
);

/**
 * Type inference from schemas
 */
export type ScholarshipCreateInput = z.infer<typeof scholarshipCreateSchema>;
export type ScholarshipUpdateInput = z.infer<typeof scholarshipUpdateSchema>;
