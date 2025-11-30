/**
 * Meeting Form Validation Schema
 * Comprehensive Zod validation for meeting forms
 */

import { z } from 'zod';

/**
 * Helper: Validate future date (meetings can't be scheduled in the past)
 */
export const futureDateSchema = z.string().refine(
  (dateStr) => {
    const meetingDate = new Date(dateStr);
    const now = new Date();
    // Allow dates from today onwards
    return meetingDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },
  {
    message: 'Toplantı tarihi geçmişte olamaz',
  }
);

/**
 * Helper: Validate meeting is at least 1 hour in the future for new meetings
 */
const futureWithBufferSchema = z.string().refine(
  (dateStr) => {
    const meetingDate = new Date(dateStr);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return meetingDate >= oneHourFromNow;
  },
  {
    message: 'Toplantı en az 1 saat sonrası için planlanmalıdır',
  }
);

/**
 * Helper: Validate participants array
 */
const participantsSchema = z
  .array(z.string())
  .min(1, 'En az bir katılımcı seçilmelidir')
  .max(50, 'En fazla 50 katılımcı seçilebilir')
  .refine(
    (participants) => {
      // Check for duplicates
      const uniqueParticipants = new Set(participants);
      return uniqueParticipants.size === participants.length;
    },
    {
      message: 'Duplicate katılımcılar var',
    }
  );

/**
 * Main Meeting Schema (for creating new meetings)
 */
export const meetingSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Başlık en az 3 karakter olmalıdır')
      .max(200, 'Başlık en fazla 200 karakter olabilir'),

    description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),

    meeting_date: futureWithBufferSchema,

    location: z.string().max(200, 'Konum en fazla 200 karakter olabilir').optional(),

    organizer: z.string().min(1, 'Düzenleyen gereklidir'),

    participants: participantsSchema,

    status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled'),

    meeting_type: z.enum(['general', 'committee', 'board', 'other'], {
      message: 'Toplantı türü seçilmelidir',
    }),

    agenda: z.string().max(2000, 'Gündem en fazla 2000 karakter olabilir').optional(),

    notes: z.string().max(2000, 'Notlar en fazla 2000 karakter olabilir').optional(),
  })
  .refine(
    (data) => {
      // Participants must include organizer
      return data.participants.includes(data.organizer);
    },
    {
      message: 'Düzenleyen katılımcılar arasında olmalıdır',
      path: ['participants'],
    }
  );

/**
 * Edit Meeting Schema (allows past dates for editing existing meetings)
 */
export const meetingEditSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Başlık en az 3 karakter olmalıdır')
      .max(200, 'Başlık en fazla 200 karakter olabilir'),

    description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),

    meeting_date: z.string(), // Allow any date for editing

    location: z.string().max(200, 'Konum en fazla 200 karakter olabilir').optional(),

    organizer: z.string().min(1, 'Düzenleyen gereklidir'),

    participants: participantsSchema,

    status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled'),

    meeting_type: z.enum(['general', 'committee', 'board', 'other'], {
      message: 'Toplantı türü seçilmelidir',
    }),

    agenda: z.string().max(2000, 'Gündem en fazla 2000 karakter olabilir').optional(),

    notes: z.string().max(2000, 'Notlar en fazla 2000 karakter olabilir').optional(),
  })
  .refine(
    (data) => {
      // Participants must include organizer
      return data.participants.includes(data.organizer);
    },
    {
      message: 'Düzenleyen katılımcılar arasında olmalıdır',
      path: ['participants'],
    }
  );

/**
 * Type exports
 */
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type MeetingEditFormData = z.infer<typeof meetingEditSchema>;

/**
 * Helper function to check if meeting is within 1 hour
 */
export function isWithinOneHour(dateStr: string): boolean {
  const meetingDate = new Date(dateStr);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  return meetingDate < oneHourFromNow && meetingDate > new Date();
}

/**
 * Helper function to format Turkish meeting type labels
 */
export const meetingTypeLabels: Record<string, string> = {
  general: 'Genel',
  committee: 'Komite',
  board: 'Yönetim Kurulu',
  other: 'Diğer',
};

/**
 * Helper function to format Turkish status labels
 */
export const meetingStatusLabels: Record<string, string> = {
  scheduled: 'Planlandı',
  ongoing: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};
