import { NextRequest } from 'next/server';
import { appwriteTodos } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';
import { todoUpdateSchema } from '@/lib/validations/todo';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/todos/[id]
 * Fetch a single todo by ID
 */
export const GET = buildApiRoute({
  requireModule: 'todos',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 200, windowMs: 900000 },
})(async (_request: NextRequest, context?: RouteParams) => {
  const { id } = await context!.params;

  // Validate ID format
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    logger.warn('Invalid todo ID format', { id });
    return errorResponse('Geçersiz todo ID', 400);
  }

  const todo = await appwriteTodos.get(id);

  if (!todo) {
    logger.info('Todo not found', { id });
    return errorResponse('Todo bulunamadı', 404);
  }

  return successResponse(todo);
});

/**
 * PUT /api/todos/[id]
 * Update a todo by ID
 */
export const PUT = buildApiRoute({
  requireModule: 'todos',
  allowedMethods: ['PUT'],
  rateLimit: { maxRequests: 50, windowMs: 900000 },
  supportOfflineSync: true,
})(async (request: NextRequest, context?: RouteParams) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { id } = await context!.params;

  // Validate ID format
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    logger.warn('Invalid todo ID format in update', { id });
    return errorResponse('Geçersiz todo ID', 400);
  }

  const { data: body, error: parseError } = await parseBody<Record<string, unknown>>(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  // Validate with Zod schema
  const result = todoUpdateSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    logger.warn('Todo update validation failed', { errors, todoId: id });
    return errorResponse('Doğrulama hatası', 400, Object.values(errors).flat());
  }

  // Check if todo exists
  const existingTodo = await appwriteTodos.get(id);
  if (!existingTodo) {
    logger.info('Todo not found for update', { id });
    return errorResponse('Todo bulunamadı', 404);
  }

  const updatedTodo = await appwriteTodos.update(id, result.data);

  logger.info('Todo updated', {
    todoId: id,
    updatedFields: Object.keys(result.data),
  });

  return successResponse(updatedTodo, 'Todo başarıyla güncellendi');
});

/**
 * DELETE /api/todos/[id]
 * Delete a todo by ID
 */
export const DELETE = buildApiRoute({
  requireModule: 'todos',
  allowedMethods: ['DELETE'],
  rateLimit: { maxRequests: 50, windowMs: 900000 },
  supportOfflineSync: true,
})(async (request: NextRequest, context?: RouteParams) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { id } = await context!.params;

  // Validate ID format
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    logger.warn('Invalid todo ID format in delete', { id });
    return errorResponse('Geçersiz todo ID', 400);
  }

  // Check if todo exists
  const existingTodo = await appwriteTodos.get(id);
  if (!existingTodo) {
    logger.info('Todo not found for deletion', { id });
    return errorResponse('Todo bulunamadı', 404);
  }

  await appwriteTodos.remove(id);

  logger.info('Todo deleted', { todoId: id });

  return successResponse({ deleted: true }, 'Todo başarıyla silindi');
});
