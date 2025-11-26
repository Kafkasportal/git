import { NextRequest } from 'next/server';
import { appwriteTodos, normalizeQueryParams } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';
import { todoSchema } from '@/lib/validations/todo';

/**
 * GET /api/todos
 * Fetch all todos with optional filtering
 *
 * Query Parameters:
 * - completed: boolean - Filter by completion status
 * - priority: 'low' | 'normal' | 'high' | 'urgent' - Filter by priority
 * - created_by: string - Filter by creator user ID
 * - tags: string - Filter by tag (comma-separated)
 * - search: string - Search in title and description
 * - limit: number - Results per page (default: 100)
 * - offset: number - Pagination offset (default: 0)
 */
export const GET = buildApiRoute({
  requireModule: 'todos',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 200, windowMs: 900000 },
})(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);

  const response = await appwriteTodos.list(params);

  return successResponse({
    data: response.documents,
    total: response.total,
  });
});

/**
 * POST /api/todos
 * Create a new todo item
 *
 * Request Body:
 * {
 *   title: string (required, 1-100 chars)
 *   description?: string (max 500 chars)
 *   priority?: 'low' | 'normal' | 'high' | 'urgent' (default: 'normal')
 *   due_date?: string (ISO date string, must be future or today)
 *   tags?: string[] (max 10 items)
 *   is_read: boolean (required)
 *   created_by: string (required, current user ID)
 *   completed?: boolean (default: false)
 * }
 */
export const POST = buildApiRoute({
  requireModule: 'todos',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 50, windowMs: 900000 },
  supportOfflineSync: true,
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { data: body, error: parseError } = await parseBody<Record<string, unknown>>(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  // Validate with Zod schema
  const result = todoSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    logger.warn('Todo validation failed', { errors, userId: body.created_by });

    return errorResponse('Doğrulama hatası', 400, Object.values(errors).flat());
  }

  const todo = await appwriteTodos.create(result.data);

  logger.info('Todo created', {
    todoId: todo.$id,
    userId: result.data.created_by,
    title: result.data.title,
  });

  return successResponse(todo, 'Todo başarıyla oluşturuldu', 201);
});
