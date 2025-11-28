// KafkasDer Meeting Decision (Toplantı Kararı) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";

// === MEETING DECISION ENUMS ===

export const meetingDecisionStatusValues = [
  "acik",
  "devam",
  "kapatildi",
] as const;

// === MEETING DECISION VALIDATION SCHEMAS ===

/**
 * Base meeting decision schema
 */
export const meetingDecisionBaseSchema = z.object({
  meeting_id: z.string().min(1, "Toplantı ID gereklidir"),

  title: z
    .string()
    .min(3, "Başlık en az 3 karakter olmalıdır")
    .max(200, "Başlık en fazla 200 karakter olabilir")
    .trim(),

  summary: z
    .string()
    .max(2000, "Özet en fazla 2000 karakter olabilir")
    .trim()
    .optional(),

  owner: z.string().min(1, "Sahip kullanıcı ID gereklidir").optional(),

  created_by: z.string().min(1, "Oluşturan kullanıcı ID gereklidir"),

  status: z
    .enum(meetingDecisionStatusValues, {
      message: "Geçersiz karar durumu",
    })
    .default("acik"),

  tags: z
    .array(z.string().max(50, "Etiket en fazla 50 karakter olabilir"))
    .max(10, "En fazla 10 etiket ekleyebilirsiniz")
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
});

/**
 * Schema for creating new meeting decision
 */
export const meetingDecisionCreateSchema = meetingDecisionBaseSchema;

/**
 * Schema for updating meeting decision
 */
export const meetingDecisionUpdateSchema = meetingDecisionBaseSchema.partial();

/**
 * Type inference from schemas
 */
export type MeetingDecisionCreateInput = z.infer<
  typeof meetingDecisionCreateSchema
>;
export type MeetingDecisionUpdateInput = z.infer<
  typeof meetingDecisionUpdateSchema
>;
