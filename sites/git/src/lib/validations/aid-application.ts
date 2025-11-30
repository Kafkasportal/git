import { z } from "zod";
import type { AidApplicationDocument } from "@/types/database";

/**
 * Zod schema for validating AidApplicationDocument
 * Used for runtime validation of API responses
 */
export const aidApplicationDocumentSchema = z.object({
  // Document base fields (matching Document interface)
  _id: z.string().min(1).optional(),
  _creationTime: z.number().optional(),
  _updatedAt: z.number().optional(),
  _collectionId: z.string().optional(),
  _databaseId: z.string().optional(),
  $id: z.string().optional(),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
  $permissions: z.array(z.string()).optional(),
  $collectionId: z.string().optional(),
  $databaseId: z.string().optional(),
  id: z.string().optional(),

  // Başvuru Bilgileri
  application_date: z.string(),
  applicant_type: z.enum(["person", "organization", "partner"]),
  applicant_name: z.string().min(1),
  beneficiary_id: z.string().optional(),

  // Yardım Türleri
  one_time_aid: z.number().min(0).optional(),
  regular_financial_aid: z.number().min(0).optional(),
  regular_food_aid: z.number().min(0).optional(),
  in_kind_aid: z.number().min(0).optional(),
  service_referral: z.number().min(0).optional(),

  // Aşama ve Durum
  stage: z.enum(["draft", "under_review", "approved", "ongoing", "completed"]),
  status: z.enum(["open", "closed"]),

  // Detaylar
  description: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),

  // İşlem Bilgileri
  processed_by: z.string().optional(),
  processed_at: z.string().optional(),
  approved_by: z.string().optional(),
  approved_at: z.string().optional(),
  completed_at: z.string().optional(),
}) satisfies z.ZodType<AidApplicationDocument>;

/**
 * Type guard function to validate if data is a valid AidApplicationDocument
 */
export function isValidAidApplicationDocument(
  data: unknown,
): data is AidApplicationDocument {
  return aidApplicationDocumentSchema.safeParse(data).success;
}

/**
 * Validates and parses an AidApplicationDocument from unknown data
 * Returns the validated document or null if validation fails
 */
export function validateAidApplicationDocument(
  data: unknown,
): AidApplicationDocument | null {
  const result = aidApplicationDocumentSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}
