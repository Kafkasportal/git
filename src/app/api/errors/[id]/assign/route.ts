/**
 * Error Assignment API
 * POST /api/errors/[id]/assign - Assign error to user and create task
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteErrors, appwriteTasks } from '@/lib/appwrite/api';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const logger = createLogger('api:errors:assign');

const assignSchema = z.object({
  assigned_to: z.string(),
  create_task: z.boolean().optional().default(true),
});

/**
 * POST /api/errors/[id]/assign
 * Assign error to user and optionally create a task
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validationResult = assignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { assigned_to, create_task } = validationResult.data;

    logger.info('Assigning error', { id, assigned_to, create_task });

    // Get error details
    const error = await appwriteErrors.get(id);
    if (!error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error not found',
        },
        { status: 404 }
      );
    }

    // Assign error
    const updatedError = await appwriteErrors.update(id, {
      assigned_to,
      status: 'assigned',
    });

    // Create task if requested
    let taskId: string | null = null;
    if (create_task) {
      try {
        const errorData = error as any;
        // Determine task priority based on error severity
        let taskPriority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
        if (errorData.severity === 'critical') taskPriority = 'urgent';
        else if (errorData.severity === 'high') taskPriority = 'high';
        else if (errorData.severity === 'medium') taskPriority = 'normal';
        else taskPriority = 'low';

        // Create task
        const task = await appwriteTasks.create({
          title: `Fix: ${errorData.title}`,
          description: `${errorData.description || ''}

Hata Kodu: ${errorData.error_code || 'N/A'}
Kategori: ${errorData.category || 'N/A'}
${errorData.component ? `Bileşen: ${errorData.component}` : ''}`,
          assigned_to,
          created_by: assigned_to, // In real scenario, would be current user
          priority: taskPriority,
          status: 'pending',
          category: 'bug_fix',
          tags: ['error', errorData.category, errorData.severity].filter(Boolean),
          is_read: false,
        });

        taskId = (task as any).$id || (task as any).id || '';

        // Link task to error in metadata
        await appwriteErrors.update(id, {
          metadata: {
            ...(errorData.metadata || {}),
            linked_task_id: taskId,
          },
        });

        logger.info('Task created for error', { errorId: id, taskId });
      } catch (taskError) {
        logger.error('Failed to create task for error', taskError, { errorId: id });
        // Continue even if task creation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        error: updatedError,
        taskId,
      },
      message: 'Error assigned successfully',
    });
  } catch (error) {
    logger.error('Failed to assign error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
