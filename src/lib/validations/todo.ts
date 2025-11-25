// Todo Management Form Validation Schemas
// Zod ile form validasyonu

import { z } from 'zod';

// === HELPER VALIDATORS ===

// Future date validation (due date should be today or future)
const futureDateSchema = z
  .string()
  .refine((dateStr: string) => {
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

// === MAIN TODO SCHEMA ===
export const todoSchema = z
  .object({
    // Required fields
    title: z
      .string()
      .min(1, 'Yapılacak başlığı boş olamaz')
      .max(100, 'Yapılacak başlığı en fazla 100 karakter olmalıdır')
      .trim(),

    created_by: z.string().min(1, 'Oluşturan kullanıcı zorunludur'),

    completed: z.boolean().default(false),

    priority: priorityEnum.default('normal'),

    is_read: z.boolean().default(false),

    // Optional fields
    description: z.string().max(500, 'Açıklama en fazla 500 karakter olmalıdır').optional(),

    due_date: futureDateSchema,

    completed_at: z.string().optional(),

    tags: z.array(tagSchema).max(10, 'En fazla 10 etiket eklenebilir').optional(),
  })
  .strict();

// === CREATE/UPDATE SCHEMAS ===

export const todoCreateSchema = todoSchema.omit({
  created_by: true, // Will be set automatically
});

export const todoUpdateSchema = todoSchema.omit({ created_by: true }).partial().strict();

// === QUICK TODO SCHEMA (minimal fields) ===

export const quickTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Yapılacak başlığı boş olamaz')
    .max(100, 'Yapılacak başlığı en fazla 100 karakter olmalıdır')
    .trim(),

  priority: priorityEnum.optional().default('normal'),

  created_by: z.string().min(1, 'Oluşturan kullanıcı zorunludur'),
});

// === FILTER SCHEMA ===

export const todoFilterSchema = z.object({
  completed: z
    .enum(['true', 'false'])
    .optional()
    .transform((val: string | undefined) => val === 'true'),
  priority: priorityEnum.optional(),
  created_by: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
});

// Type exports
export type Todo = z.infer<typeof todoSchema>;
export type TodoCreate = z.infer<typeof todoCreateSchema>;
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;
export type QuickTodo = z.infer<typeof quickTodoSchema>;
export type TodoFilter = z.infer<typeof todoFilterSchema>;

// === HELPER FUNCTIONS ===

export const isTodoCompleted = (todo: Todo): boolean => {
  return todo.completed;
};

export const isTodoOverdue = (todo: Todo): boolean => {
  if (!todo.due_date || todo.completed) return false;
  const dueDate = new Date(todo.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

export const isTodoDueSoon = (todo: Todo): boolean => {
  if (!todo.due_date || todo.completed) return false;
  const dueDate = new Date(todo.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  return dueDate >= today && dueDate <= threeDaysFromNow;
};

export const getPriorityColor = (priority: Todo['priority']): string => {
  const colors: Record<Todo['priority'], string> = {
    low: 'text-blue-500',
    normal: 'text-green-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  return colors[priority] || colors.normal;
};

export const getPriorityLabel = (priority: Todo['priority']): string => {
  const labels: Record<Todo['priority'], string> = {
    low: 'Düşük',
    normal: 'Normal',
    high: 'Yüksek',
    urgent: 'Acil',
  };
  return labels[priority] || labels.normal;
};
