import { NextRequest, NextResponse } from 'next/server';
import { appwriteTodos, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';
import { parseBody } from '@/lib/api/route-helpers';
import { dataModificationRateLimit, readOnlyRateLimit } from '@/lib/rate-limit';
import { todoSchema } from '@/lib/validations/todo';

/**
 * GET /api/todos
 * Fetch all todos with optional filtering
 *
 * @param request - Next.js request object
 * @returns JSON response with todo list and total count
 *
 * Query Parameters:
 * - completed: boolean - Filter by completion status
 * - priority: 'low' | 'normal' | 'high' | 'urgent' - Filter by priority
 * - created_by: string - Filter by creator user ID
 * - tags: string - Filter by tag (comma-separated)
 * - search: string - Search in title and description
 * - limit: number - Results per page (default: 100)
 * - offset: number - Pagination offset (default: 0)
 *
 * Security:
 * - Requires 'todos' module access
 * - Rate limited for read operations
 */
async function getTodosHandler(request: NextRequest) {
  try {
    await requireModuleAccess('todos');
    await readOnlyRateLimit(request);

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const response = await appwriteTodos.list(params);

    return NextResponse.json({
      success: true,
      data: response.documents,
      total: response.total,
    });
  } catch (error) {
    logger.error('Failed to fetch todos', { error, url: request.url });
    return buildErrorResponse(error, 500);
  }
}

/**
 * POST /api/todos
 * Create a new todo item
 *
 * @param request - Next.js request object with JSON body
 * @returns JSON response with created todo
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
 *
 * Response Status Codes:
 * - 201 Created - Todo successfully created
 * - 400 Bad Request - Invalid input data
 * - 401 Unauthorized - User not authenticated
 * - 403 Forbidden - User lacks required module access
 * - 429 Too Many Requests - Rate limit exceeded
 * - 500 Internal Server Error - Server error
 *
 * Security:
 * - Requires 'todos' module access
 * - CSRF token verification required
 * - Rate limited for data modifications
 * - Input validated with Zod schema
 */
async function createTodoHandler(request: NextRequest) {
  try {
    await requireModuleAccess('todos');
    await verifyCsrfToken(request);
    await dataModificationRateLimit(request);

    const body = await parseBody(request);

    // Validate with Zod schema
    const result = todoSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      logger.warn('Todo validation failed', { errors, userId: body.created_by });

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const todo = await appwriteTodos.create(result.data);

    logger.info('Todo created', {
      todoId: todo.$id,
      userId: result.data.created_by,
      title: result.data.title,
    });

    return NextResponse.json(
      {
        success: true,
        data: todo,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create todo', { error });
    return buildErrorResponse(error, 500);
  }
}

export async function GET(request: NextRequest) {
  return getTodosHandler(request);
}

export async function POST(request: NextRequest) {
  return createTodoHandler(request);
}
