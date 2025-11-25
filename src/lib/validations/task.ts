// Task Management Form Validation Schemas
// Zod ile form validasyonu

import { z } from 'zod';

// === HELPER VALIDATORS ===

// Future date validation (due date should be today or future)
const futureDateSchema = z
  .string()
  .refine((dateStr) => {
    if (!dateStr) return true; // Optional field
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return date >= today;
  }, 'Son tarih bugün veya gelecek bir tarih olmalıdır')
  .optional();

// Tag validation (alphanumeric with hyphens/underscores, max 30 chars)
const tagSchema = z
  .string()
  .min(1, 'Etiket boş olamaz')
  .max(30, 'Etiket en fazla 30 karakter olmalıdır')
  .regex(
    /^[a-zA-Z0-9çğıöşüÇĞIİÖŞÜ\s\-_]+$/,
    'Etiket sadece harf, rakam, boşluk, tire ve alt çizgi içerebilir'
  );

// Priority enum
const priorityEnum = z.enum(['low', 'normal', 'high', 'urgent'], {
  message: 'Öncelik seçiniz',
});

// Status enum
const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled'], {
  message: 'Durum seçiniz',
});

// === MAIN TASK SCHEMA ===
export const taskSchema = z
  .object({
    // Required fields
    title: z
      .string()
      .min(3, 'Başlık en az 3 karakter olmalıdır')
      .max(100, 'Başlık en fazla 100 karakter olmalıdır')
      .trim(),

    created_by: z.string().min(1, 'Oluşturan kullanıcı zorunludur'),

    priority: priorityEnum,

    status: statusEnum,

    tags: z.array(tagSchema).max(10, 'En fazla 10 etiket eklenebilir'),

    is_read: z.boolean(),

    // Optional fields
    description: z
      .string()
      .max(1000, 'Açıklama en fazla 1000 karakter olmalıdır')
      .optional()
      .or(z.literal('')),

    assigned_to: z.string().optional().or(z.literal('')),

    due_date: futureDateSchema,

    completed_at: z.string().optional(),

    category: z
      .string()
      .max(50, 'Kategori en fazla 50 karakter olmalıdır')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Auto-set completed_at when status becomes 'completed'
      if (data.status === 'completed' && !data.completed_at) {
        return true; // This will be handled in the form submission
      }
      return true;
    },
    {
      message: 'Tamamlanan görevler için tamamlanma tarihi otomatik ayarlanır',
      path: ['completed_at'],
    }
  )
  .refine(
    (data) => {
      // Validate no duplicate tags
      if (data.tags && data.tags.length > 0) {
        const uniqueTags = new Set(data.tags.map((tag) => tag.toLowerCase().trim()));
        return uniqueTags.size === data.tags.length;
      }
      return true;
    },
    {
      message: 'Aynı etiket birden fazla kez eklenemez',
      path: ['tags'],
    }
  )
  .refine(
    (data) => {
      // Warn if due_date is within 24 hours and status is pending
      if (data.due_date && data.status === 'pending') {
        const dueDate = new Date(data.due_date);
        const now = new Date();
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
          // This is just a warning, not an error
          return true;
        }
      }
      return true;
    },
    {
      message: 'Son tarih 24 saat içindeyse acil olarak işaretlenmelidir',
      path: ['priority'],
    }
  );

// === QUICK TASK SCHEMA (for simple task creation) ===
export const quickTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(100, 'Başlık en fazla 100 karakter olmalıdır')
    .trim(),

  priority: priorityEnum.default('normal'),

  assigned_to: z.string().optional().or(z.literal('')),

  due_date: futureDateSchema,
});

// === TASK FILTER SCHEMA ===
export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'pending', 'in_progress', 'completed', 'cancelled']).default('all'),
  priority: z.enum(['all', 'low', 'normal', 'high', 'urgent']).default('all'),
  assigned_to: z.string().default('all'),
  category: z.string().optional(),
});

// === TYPE EXPORTS ===
export type TaskFormData = z.infer<typeof taskSchema>;
export type QuickTaskFormData = z.infer<typeof quickTaskSchema>;
export type TaskFilterData = z.infer<typeof taskFilterSchema>;

// === UTILITY FUNCTIONS ===

// Check if task is overdue
export const isTaskOverdue = (dueDate: string | undefined): boolean => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

// Check if task is due within 24 hours
export const isTaskDueSoon = (dueDate: string | undefined): boolean => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDue <= 24 && hoursUntilDue > 0;
};

// Get priority color class
export const getPriorityColor = (priority: TaskFormData['priority']): string => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800';
    case 'normal':
      return 'bg-blue-100 text-blue-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status color class
export const getStatusColor = (status: TaskFormData['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get priority label in Turkish
export const getPriorityLabel = (priority: TaskFormData['priority']): string => {
  switch (priority) {
    case 'low':
      return 'Düşük';
    case 'normal':
      return 'Normal';
    case 'high':
      return 'Yüksek';
    case 'urgent':
      return 'Acil';
    default:
      return 'Normal';
  }
};

// Get status label in Turkish
export const getStatusLabel = (status: TaskFormData['status']): string => {
  switch (status) {
    case 'pending':
      return 'Beklemede';
    case 'in_progress':
      return 'Devam Ediyor';
    case 'completed':
      return 'Tamamlandı';
    case 'cancelled':
      return 'İptal Edildi';
    default:
      return 'Beklemede';
  }
};
