// KafkasDer User (Kullanıcı) Validation Schemas
// Zod ile form validasyonu

import { z } from "zod";
import { ALL_PERMISSIONS } from "@/types/permissions";
import { phoneSchema } from "./shared-validators";

// === USER ROLE VALUES ===

export const userRoleValues = ["admin", "user", "viewer", "moderator"] as const;

// === USER VALIDATION SCHEMAS ===

/**
 * Base user schema
 */
export const userBaseSchema = z.object({
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(100, "İsim en fazla 100 karakter olabilir")
    .trim(),

  email: z
    .string()
    .email("Geçerli bir email adresi giriniz")
    .max(255, "Email en fazla 255 karakter olabilir")
    .toLowerCase()
    .trim(),

  role: z.enum(userRoleValues, {
    message: "Geçersiz kullanıcı rolü",
  }),

  permissions: z
    .array(
      z.enum(ALL_PERMISSIONS, {
        message: "Geçersiz yetki",
      }),
    )
    .min(1, "En az bir yetki seçilmelidir")
    .default([]),

  isActive: z.boolean().default(true),

  phone: phoneSchema.optional(),

  avatar: z
    .string()
    .url("Geçerli bir avatar URL'i giriniz")
    .max(500, "Avatar URL'i çok uzun")
    .optional(),

  labels: z
    .array(z.string().max(50, "Etiket en fazla 50 karakter olabilir"))
    .max(10, "En fazla 10 etiket ekleyebilirsiniz")
    .optional(),
});

/**
 * Schema for creating new user (requires password)
 */
export const userCreateSchema = userBaseSchema
  .extend({
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(128, "Şifre en fazla 128 karakter olabilir")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir",
      ),

    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Şifreler eşleşmiyor",
    path: ["passwordConfirm"],
  });

/**
 * Schema for updating user (password optional)
 */
export const userUpdateSchema = userBaseSchema
  .partial()
  .extend({
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(128, "Şifre en fazla 128 karakter olabilir")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir",
      )
      .optional(),

    passwordConfirm: z.string().optional(),
  })
  .refine(
    (data) => {
      // If password is provided, passwordConfirm must match
      if (data.password && data.password !== data.passwordConfirm) {
        return false;
      }
      return true;
    },
    {
      message: "Şifreler eşleşmiyor",
      path: ["passwordConfirm"],
    },
  );

/**
 * Schema for changing password
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),

    newPassword: z
      .string()
      .min(8, "Yeni şifre en az 8 karakter olmalıdır")
      .max(128, "Yeni şifre en fazla 128 karakter olabilir")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir",
      ),

    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Yeni şifreler eşleşmiyor",
    path: ["newPasswordConfirm"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Yeni şifre mevcut şifreden farklı olmalıdır",
    path: ["newPassword"],
  });

/**
 * Type inference from schemas
 */
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
