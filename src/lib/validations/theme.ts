/**
 * Theme Validation Schemas
 * Zod schemas for theme preset validation
 */

import { z } from 'zod';

/**
 * Hex color validation schema
 */
export const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Geçerli bir hex renk kodu girin');

/**
 * Theme Colors Schema
 */
export const themeColorsSchema = z.object({
  primary: hexColorSchema,
  primaryHover: hexColorSchema.optional(),
  primaryActive: hexColorSchema.optional(),
  secondary: hexColorSchema.optional(),
  secondaryHover: hexColorSchema.optional(),
  accent: hexColorSchema.optional(),
  success: hexColorSchema.optional(),
  warning: hexColorSchema.optional(),
  error: hexColorSchema.optional(),
  info: hexColorSchema.optional(),
  background: hexColorSchema.optional(),
  backgroundSecondary: hexColorSchema.optional(),
  backgroundTertiary: hexColorSchema.optional(),
  textPrimary: hexColorSchema.optional(),
  textSecondary: hexColorSchema.optional(),
  textMuted: hexColorSchema.optional(),
  border: hexColorSchema.optional(),
  borderHover: hexColorSchema.optional(),
  sidebarBg: hexColorSchema.optional(),
  sidebarText: hexColorSchema.optional(),
  sidebarActive: hexColorSchema.optional(),
});

/**
 * Theme Typography Schema
 */
export const themeTypographySchema = z.object({
  fontFamily: z.string().optional(),
  baseSize: z.number().min(10).max(24).optional(),
  headingScale: z.number().min(1).max(3).optional(),
  lineHeight: z.number().min(1).max(2).optional(),
  fontWeightRegular: z.number().min(100).max(900).optional(),
  fontWeightMedium: z.number().min(100).max(900).optional(),
  fontWeightBold: z.number().min(100).max(900).optional(),
});

/**
 * Theme Layout Schema
 */
export const themeLayoutSchema = z.object({
  sidebarWidth: z.number().min(200).max(400).optional(),
  containerMaxWidth: z.number().min(600).max(2000).optional(),
  borderRadius: z.number().min(0).max(50).optional(),
  spacingScale: z.enum(['tight', 'normal', 'relaxed']).optional(),
  cardElevation: z.enum(['flat', 'subtle', 'medium', 'high']).optional(),
});

/**
 * Theme Preset Schema
 */
export const themePresetSchema = z.object({
  name: z.string().min(2, 'Tema adı en az 2 karakter olmalıdır').max(100, 'Tema adı en fazla 100 karakter olabilir'),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').optional(),
  colors: themeColorsSchema,
  typography: themeTypographySchema.optional(),
  layout: themeLayoutSchema.optional(),
  isDefault: z.boolean().optional().default(false),
  isCustom: z.boolean().optional().default(false),
});

/**
 * Theme Preset Form Data Type
 */
export type ThemePresetFormData = z.infer<typeof themePresetSchema>;

