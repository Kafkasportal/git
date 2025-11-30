// KafkasDer Scholarship (Burs) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";

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
  student_name: z
    .string()
    .min(2, "Öğrenci adı en az 2 karakter olmalıdır")
    .max(100, "Öğrenci adı en fazla 100 karakter olabilir")
    .trim(),

  tc_no: z
    .string()
    .length(11, "TC Kimlik No 11 haneli olmalıdır")
    .regex(/^\d{11}$/, "TC Kimlik No sadece rakam içermelidir")
    .refine((value) => {
      // İlk hane 0 olamaz
      if (value[0] === "0") return false;

      // TC Kimlik No algoritma kontrolü
      const digits = value.split("").map(Number);

      // 10. hane kontrolü
      const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
      const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
      const check10 = (oddSum * 7 - evenSum) % 10;

      if (digits[9] !== check10) return false;

      // 11. hane kontrolü
      const sum10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
      const check11 = sum10 % 10;

      return digits[10] === check11;
    }, "Geçersiz TC Kimlik No"),

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
