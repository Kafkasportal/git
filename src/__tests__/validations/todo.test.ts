import { describe, it, expect } from 'vitest';
import {
  todoSchema,
  todoCreateSchema,
  todoUpdateSchema,
  quickTodoSchema,
  todoFilterSchema,
  isTodoCompleted,
  isTodoOverdue,
  isTodoDueSoon,
  getPriorityColor,
  getPriorityLabel,
  type Todo,
} from '@/lib/validations/todo';

describe('Todo Validation Schemas', () => {
  const validTodo = {
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    completed: false,
    created_by: 'user-123',
    priority: 'normal' as const,
    is_read: false,
    tags: ['shopping'],
    due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  };

  describe('todoSchema', () => {
    it('should validate a complete todo', () => {
      const result = todoSchema.safeParse(validTodo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Buy groceries');
        expect(result.data.priority).toBe('normal');
      }
    });

    it('should reject todo with empty title', () => {
      const result = todoSchema.safeParse({ ...validTodo, title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject todo with invalid priority', () => {
      const result = todoSchema.safeParse({
        ...validTodo,
        priority: 'invalid' as never,
      });
      expect(result.success).toBe(false);
    });

    it('should reject todo with invalid completed value', () => {
      const result = todoSchema.safeParse({
        ...validTodo,
        completed: 'yes' as never,
      });
      expect(result.success).toBe(false);
    });

    it('should reject todo with past due date', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const result = todoSchema.safeParse({
        ...validTodo,
        due_date: pastDate,
      });
      expect(result.success).toBe(false);
    });

    it('should accept todo without optional fields', () => {
      const minimal = {
        title: 'Task',
        created_by: 'user-123',
        priority: 'normal' as const,
        is_read: false,
      };
      const result = todoSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('should set default values', () => {
      const minimal = {
        title: 'Task',
        created_by: 'user-123',
        priority: 'normal' as const,
        is_read: false,
      };
      const result = todoSchema.safeParse(minimal);
      if (result.success) {
        expect(result.data.completed).toBe(false);
      }
    });

    it('should accept todo with max 10 tags', () => {
      const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);
      const result = todoSchema.safeParse({ ...validTodo, tags });
      expect(result.success).toBe(true);
    });

    it('should reject todo with more than 10 tags', () => {
      const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      const result = todoSchema.safeParse({ ...validTodo, tags });
      expect(result.success).toBe(false);
    });

    it('should reject todo with invalid tag format', () => {
      const result = todoSchema.safeParse({
        ...validTodo,
        tags: ['valid-tag', 'invalid@tag'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject todo with title exceeding 100 chars', () => {
      const longTitle = 'a'.repeat(101);
      const result = todoSchema.safeParse({
        ...validTodo,
        title: longTitle,
      });
      expect(result.success).toBe(false);
    });

    it('should reject todo with description exceeding 500 chars', () => {
      const longDesc = 'a'.repeat(501);
      const result = todoSchema.safeParse({
        ...validTodo,
        description: longDesc,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('todoCreateSchema', () => {
    it('should not require created_by', () => {
      const { created_by, ...todoWithoutCreator } = validTodo;
      const result = todoCreateSchema.safeParse(todoWithoutCreator);
      expect(result.success).toBe(true);
    });

    it('should accept valid create data', () => {
      const { created_by, ...createData } = validTodo;
      const result = todoCreateSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });
  });

  describe('todoUpdateSchema', () => {
    it('should allow partial updates', () => {
      const updateData = {
        completed: true,
        title: 'Updated Title',
      };
      const result = todoUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow empty update', () => {
      const result = todoUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should not allow created_by in updates', () => {
      const updateData = {
        title: 'New Title',
        created_by: 'new-user',
      };
      const result = todoUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });

  describe('quickTodoSchema', () => {
    it('should validate quick todo with minimal fields', () => {
      const quickTodo = {
        title: 'Quick task',
        created_by: 'user-123',
      };
      const result = quickTodoSchema.safeParse(quickTodo);
      expect(result.success).toBe(true);
    });

    it('should set default priority', () => {
      const quickTodo = {
        title: 'Quick task',
        created_by: 'user-123',
      };
      const result = quickTodoSchema.safeParse(quickTodo);
      if (result.success) {
        expect(result.data.priority).toBe('normal');
      }
    });
  });

  describe('todoFilterSchema', () => {
    it('should parse completed filter as boolean', () => {
      const result = todoFilterSchema.safeParse({ completed: 'true' });
      if (result.success) {
        expect(result.data.completed).toBe(true);
      }
    });

    it('should parse false completed filter', () => {
      const result = todoFilterSchema.safeParse({ completed: 'false' });
      if (result.success) {
        expect(result.data.completed).toBe(false);
      }
    });

    it('should accept all filter combinations', () => {
      const filters = {
        completed: 'true',
        priority: 'high' as const,
        created_by: 'user-123',
        tags: 'work',
        search: 'important',
      };
      const result = todoFilterSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });
  });
});

describe('Todo Helper Functions', () => {
  const completedTodo: Todo = {
    $id: '1',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    $databaseId: 'db',
    $collectionId: 'col',
    title: 'Completed task',
    completed: true,
    completed_at: new Date().toISOString(),
    created_by: 'user-123',
    priority: 'normal',
    is_read: false,
  };

  const pendingTodo: Todo = {
    $id: '2',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    $databaseId: 'db',
    $collectionId: 'col',
    title: 'Pending task',
    completed: false,
    created_by: 'user-123',
    priority: 'high',
    is_read: false,
    due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  };

  const overdueTodo: Todo = {
    ...pendingTodo,
    $id: '3',
    title: 'Overdue task',
    due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  };

  describe('isTodoCompleted', () => {
    it('should return true for completed todo', () => {
      expect(isTodoCompleted(completedTodo)).toBe(true);
    });

    it('should return false for pending todo', () => {
      expect(isTodoCompleted(pendingTodo)).toBe(false);
    });
  });

  describe('isTodoOverdue', () => {
    it('should return false for completed todo', () => {
      expect(isTodoOverdue(completedTodo)).toBe(false);
    });

    it('should return false for pending todo without due date', () => {
      const todo = { ...pendingTodo, due_date: undefined };
      expect(isTodoOverdue(todo)).toBe(false);
    });

    it('should return true for overdue todo', () => {
      expect(isTodoOverdue(overdueTodo)).toBe(true);
    });

    it('should return false for future due date', () => {
      expect(isTodoOverdue(pendingTodo)).toBe(false);
    });
  });

  describe('isTodoDueSoon', () => {
    it('should return false for completed todo', () => {
      expect(isTodoDueSoon(completedTodo)).toBe(false);
    });

    it('should return false for todo without due date', () => {
      const todo = { ...pendingTodo, due_date: undefined };
      expect(isTodoDueSoon(todo)).toBe(false);
    });

    it('should return true for todo due within 3 days', () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const todo = { ...pendingTodo, due_date: tomorrow.toISOString() };
      expect(isTodoDueSoon(todo)).toBe(true);
    });

    it('should return false for todo due more than 3 days away', () => {
      const farFuture = new Date(Date.now() + 604800000); // 7 days
      const todo = { ...pendingTodo, due_date: farFuture.toISOString() };
      expect(isTodoDueSoon(todo)).toBe(false);
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct colors for all priorities', () => {
      expect(getPriorityColor('low')).toBe('text-blue-500');
      expect(getPriorityColor('normal')).toBe('text-green-500');
      expect(getPriorityColor('high')).toBe('text-orange-500');
      expect(getPriorityColor('urgent')).toBe('text-red-500');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct labels for all priorities', () => {
      expect(getPriorityLabel('low')).toBe('Düşük');
      expect(getPriorityLabel('normal')).toBe('Normal');
      expect(getPriorityLabel('high')).toBe('Yüksek');
      expect(getPriorityLabel('urgent')).toBe('Acil');
    });
  });
});
