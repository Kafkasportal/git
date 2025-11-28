import { NextRequest, NextResponse } from 'next/server';
import { appwriteTodos } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';
import { parseBody } from '@/lib/api/route-helpers';
import { dataModificationRateLimit, readOnlyRateLimit } from '@/lib/rate-limit';
import { todoUpdateSchema } from '@/lib/validations/todo';

/**
 * GET /api/todos/[id]
 * Fetch a single todo by ID
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing todo ID
 * @returns JSON response with todo data
 *
 * Response Status Codes:
 * - 200 OK - Todo found and returned
 * - 400 Bad Request - Invalid ID format
 * - 401 Unauthorized - User not authenticated
 * - 403 Forbidden - User lacks required module access
 * - 404 Not Found - Todo does not exist
 * - 429 Too Many Requests - Rate limit exceeded
 * - 500 Internal Server Error - Server error
 *
 * Security:
 * - Requires 'todos' module access
 * - Rate limited for read operations
 */
async function getTodoHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireModuleAccess('todos');
    await readOnlyRateLimit(request);

    const { id } = params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      logger.warn('Invalid todo ID format', { id });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid todo ID',
        },
        { status: 400 }
      );
    }

    const todo = await appwriteTodos.get(id);

    if (!todo) {
      logger.info('Todo not found', { id });
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    logger.error('Failed to fetch todo', { error, todoId: params.id });
    return buildErrorResponse(error, 500);
  }
}

/**
 * PUT /api/todos/[id]
 * Update a todo by ID
 *
 * @param request - Next.js request object with JSON body
 * @param params - Route parameters containing todo ID
 * @returns JSON response with updated todo
 *
 * Request Body (partial update):
 * - Any fields from todoUpdateSchema can be updated
 * - created_by cannot be changed
 *
 * Response Status Codes:
 * - 200 OK - Todo successfully updated
 * - 400 Bad Request - Invalid ID or request body
 * - 401 Unauthorized - User not authenticated
 * - 403 Forbidden - User lacks required module access
 * - 404 Not Found - Todo does not exist
 * - 429 Too Many Requests - Rate limit exceeded
 * - 500 Internal Server Error - Server error
 *
 * Security:
 * - Requires 'todos' module access
 * - CSRF token verification required
 * - Rate limited for data modifications
 * - Input validated with Zod schema
 * - Prevents changing created_by field
 */
async function updateTodoHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireModuleAccess('todos');
    await verifyCsrfToken(request);
    await dataModificationRateLimit(request);

    const { id } = params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      logger.warn('Invalid todo ID format in update', { id });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid todo ID',
        },
        { status: 400 }
      );
    }

    const body = await parseBody(request);

    // Validate with Zod schema
    const result = todoUpdateSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      logger.warn('Todo update validation failed', { errors, todoId: id });

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Check if todo exists
    const existingTodo = await appwriteTodos.get(id);
    if (!existingTodo) {
      logger.info('Todo not found for update', { id });
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }

    const updatedTodo = await appwriteTodos.update(id, result.data);

    logger.info('Todo updated', {
      todoId: id,
      updatedFields: Object.keys(result.data),
    });

    return NextResponse.json({
      success: true,
      data: updatedTodo,
    });
  } catch (error) {
    logger.error('Failed to update todo', { error, todoId: params.id });
    return buildErrorResponse(error, 500);
  }
}

/**
 * DELETE /api/todos/[id]
 * Delete a todo by ID
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing todo ID
 * @returns JSON response confirming deletion
 *
 * Response Status Codes:
 * - 200 OK - Todo successfully deleted
 * - 400 Bad Request - Invalid ID format
 * - 401 Unauthorized - User not authenticated
 * - 403 Forbidden - User lacks required module access
 * - 404 Not Found - Todo does not exist
 * - 429 Too Many Requests - Rate limit exceeded
 * - 500 Internal Server Error - Server error
 *
 * Security:
 * - Requires 'todos' module access
 * - CSRF token verification required
 * - Rate limited for data modifications
 */
async function deleteTodoHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireModuleAccess('todos');
    await verifyCsrfToken(request);
    await dataModificationRateLimit(request);

    const { id } = params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      logger.warn('Invalid todo ID format in delete', { id });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid todo ID',
        },
        { status: 400 }
      );
    }

    // Check if todo exists
    const existingTodo = await appwriteTodos.get(id);
    if (!existingTodo) {
      logger.info('Todo not found for deletion', { id });
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }

    await appwriteTodos.remove(id);

    logger.info('Todo deleted', { todoId: id });

    return NextResponse.json({
      success: true,
      message: 'Todo deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete todo', { error, todoId: params.id });
    return buildErrorResponse(error, 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return getTodoHandler(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return updateTodoHandler(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return deleteTodoHandler(request, { params });
}
