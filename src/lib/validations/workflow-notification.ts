// KafkasDer Workflow Notification (İş Akışı Bildirimi) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";

// === WORKFLOW NOTIFICATION ENUMS ===

export const notificationCategoryValues = [
  "meeting",
  "gorev",
  "rapor",
  "hatirlatma",
] as const;
export const notificationStatusValues = [
  "beklemede",
  "gonderildi",
  "okundu",
] as const;
export const referenceTypeValues = [
  "meeting_action_item",
  "meeting",
  "meeting_decision",
] as const;

// === WORKFLOW NOTIFICATION VALIDATION SCHEMAS ===

/**
 * Reference schema
 */
const referenceSchema = z.object({
  type: z.enum(referenceTypeValues, {
    message: "Geçersiz referans tipi",
  }),
  id: z.string().min(1, "Referans ID gereklidir"),
});

/**
 * Base workflow notification schema
 */
export const workflowNotificationBaseSchema = z.object({
  recipient: z.string().min(1, "Alıcı kullanıcı ID gereklidir"),

  category: z.enum(notificationCategoryValues, {
    message: "Geçersiz bildirim kategorisi",
  }),

  title: z
    .string()
    .min(3, "Başlık en az 3 karakter olmalıdır")
    .max(200, "Başlık en fazla 200 karakter olabilir")
    .trim(),

  triggered_by: z
    .string()
    .min(1, "Tetikleyen kullanıcı ID gereklidir")
    .optional(),

  body: z
    .string()
    .max(2000, "İçerik en fazla 2000 karakter olabilir")
    .trim()
    .optional(),

  status: z
    .enum(notificationStatusValues, {
      message: "Geçersiz bildirim durumu",
    })
    .default("beklemede"),

  reference: referenceSchema.optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),

  created_at: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Geçersiz oluşturma tarihi formatı" },
    )
    .optional(),
});

/**
 * Schema for creating new workflow notification
 */
export const workflowNotificationCreateSchema = workflowNotificationBaseSchema;

/**
 * Schema for updating workflow notification
 */
export const workflowNotificationUpdateSchema =
  workflowNotificationBaseSchema.partial();

/**
 * Type inference from schemas
 */
export type WorkflowNotificationCreateInput = z.infer<
  typeof workflowNotificationCreateSchema
>;
export type WorkflowNotificationUpdateInput = z.infer<
  typeof workflowNotificationUpdateSchema
>;
