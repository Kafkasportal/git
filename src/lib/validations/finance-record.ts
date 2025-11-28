// KafkasDer Finance Record (Finans Kaydı) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";

// === FINANCE RECORD ENUMS ===

export const recordTypeValues = ["income", "expense"] as const;
export const currencyValues = ["TRY", "USD", "EUR"] as const;
export const financeStatusValues = ["pending", "approved", "rejected"] as const;

// === FINANCE RECORD VALIDATION SCHEMAS ===

/**
 * Base finance record schema
 */
export const financeRecordBaseSchema = z.object({
  record_type: z.enum(recordTypeValues, {
    message: "Geçersiz kayıt tipi",
  }),

  category: z
    .string()
    .min(2, "Kategori en az 2 karakter olmalıdır")
    .max(100, "Kategori en fazla 100 karakter olabilir")
    .trim(),

  amount: z
    .number()
    .positive("Tutar pozitif olmalıdır")
    .max(9999999999, "Tutar çok yüksek")
    .refine(
      (val) => {
        // Check if has max 2 decimal places
        return Number.isInteger(val * 100);
      },
      { message: "Tutar en fazla 2 ondalık basamak içerebilir" },
    ),

  currency: z
    .enum(currencyValues, {
      message: "Geçersiz para birimi",
    })
    .default("TRY"),

  description: z
    .string()
    .min(5, "Açıklama en az 5 karakter olmalıdır")
    .max(1000, "Açıklama en fazla 1000 karakter olabilir")
    .trim(),

  transaction_date: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz işlem tarihi formatı" },
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const now = new Date();
        // Transaction date should not be in the future
        return date <= now;
      },
      { message: "İşlem tarihi gelecekte olamaz" },
    ),

  created_by: z.string().min(1, "Oluşturan kullanıcı gereklidir"),

  status: z
    .enum(financeStatusValues, {
      message: "Geçersiz durum",
    })
    .default("pending"),

  payment_method: z
    .string()
    .max(100, "Ödeme yöntemi en fazla 100 karakter olabilir")
    .trim()
    .optional(),

  receipt_number: z
    .string()
    .max(100, "Fiş numarası en fazla 100 karakter olabilir")
    .trim()
    .optional(),

  receipt_file_id: z
    .string()
    .max(100, "Dosya ID en fazla 100 karakter olabilir")
    .optional(),

  related_to: z
    .string()
    .max(100, "İlgili kayıt ID en fazla 100 karakter olabilir")
    .optional(),
});

/**
 * Schema for creating new finance record
 */
export const financeRecordCreateSchema = financeRecordBaseSchema;

/**
 * Schema for updating finance record
 */
export const financeRecordUpdateSchema = financeRecordBaseSchema
  .partial()
  .refine(
    (data) => {
      // If transaction_date is being updated, validate it's not in the future
      if (data.transaction_date) {
        const date = new Date(data.transaction_date);
        const now = new Date();
        return date <= now;
      }
      return true;
    },
    {
      message: "İşlem tarihi gelecekte olamaz",
      path: ["transaction_date"],
    },
  );

/**
 * Type inference from schemas
 */
export type FinanceRecordCreateInput = z.infer<
  typeof financeRecordCreateSchema
>;
export type FinanceRecordUpdateInput = z.infer<
  typeof financeRecordUpdateSchema
>;
