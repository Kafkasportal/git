// KafkasDer Meeting Action Item (Toplantı Aksiyon Maddesi) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";

// === MEETING ACTION ITEM ENUMS ===

export const actionItemStatusValues = [
  "devam",
  "beklemede",
  "hazir",
  "iptal",
] as const;

// === MEETING ACTION ITEM VALIDATION SCHEMAS ===

/**
 * Base meeting action item schema
 */
export const meetingActionItemBaseSchema = z.object({
  meeting_id: z.string().min(1, "Toplantı ID gereklidir"),

  title: z
    .string()
    .min(3, "Başlık en az 3 karakter olmalıdır")
    .max(200, "Başlık en fazla 200 karakter olabilir")
    .trim(),

  assigned_to: z.string().min(1, "Atanan kullanıcı ID gereklidir"),

  created_by: z.string().min(1, "Oluşturan kullanıcı ID gereklidir"),

  decision_id: z.string().min(1, "Karar ID gereklidir").optional(),

  description: z
    .string()
    .max(2000, "Açıklama en fazla 2000 karakter olabilir")
    .trim()
    .optional(),

  due_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz bitiş tarihi formatı" },
    )
    .optional(),

  status: z
    .enum(actionItemStatusValues, {
      message: "Geçersiz aksiyon durumu",
    })
    .default("beklemede"),

  notes: z
    .array(z.string().max(500, "Not en fazla 500 karakter olabilir"))
    .max(20, "En fazla 20 not ekleyebilirsiniz")
    .optional(),

  reminder_scheduled_at: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz hatırlatma tarihi formatı" },
    )
    .optional(),
});

/**
 * Schema for creating new meeting action item
 */
export const meetingActionItemCreateSchema = meetingActionItemBaseSchema;

/**
 * Schema for updating meeting action item
 */
export const meetingActionItemUpdateSchema =
  meetingActionItemBaseSchema.partial();

/**
 * Type inference from schemas
 */
export type MeetingActionItemCreateInput = z.infer<
  typeof meetingActionItemCreateSchema
>;
export type MeetingActionItemUpdateInput = z.infer<
  typeof meetingActionItemUpdateSchema
>;
