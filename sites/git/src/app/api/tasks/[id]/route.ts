import { NextRequest, NextResponse } from 'next/server';
import { appwriteTasks } from '@/lib/appwrite/api';
import { extractParams } from '@/lib/api/route-helpers';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

function validateTaskUpdate(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (data.title && typeof data.title === 'string' && data.title.trim().length < 3) {
    errors.push('Görev başlığı en az 3 karakter olmalıdır');
  }
  if (data.priority && !['low', 'normal', 'high', 'urgent'].includes(data.priority as string)) {
    errors.push('Geçersiz öncelik değeri');
  }
  if (
    data.status &&
    !['pending', 'in_progress', 'completed', 'cancelled'].includes(data.status as string)
  ) {
    errors.push('Geçersiz durum');
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * GET /api/tasks/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);
  try {
    await requireModuleAccess('workflow');

    const task = await appwriteTasks.get(id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Görev bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Get task error', _error, {
      endpoint: '/api/tasks/[id]',
      method: request.method,
      taskId: id,
    });
    return NextResponse.json({ success: false, error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    const body = (await request.json()) as Record<string, unknown>;

    const validation = validateTaskUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const taskData: Parameters<typeof appwriteTasks.update>[1] = {
      title: body.title as string | undefined,
      description: body.description as string | undefined,
      assigned_to: body.assigned_to as string | undefined,
      priority: body.priority as 'low' | 'normal' | 'high' | 'urgent' | undefined,
      status: body.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | undefined,
      due_date: body.due_date as string | undefined,
      completed_at: body.completed_at as string | undefined,
      is_read: body.is_read as boolean | undefined,
    };

    const updated = await appwriteTasks.update(id, taskData);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Görev başarıyla güncellendi',
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Update task error', _error, {
      endpoint: '/api/tasks/[id]',
      method: request.method,
      taskId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Görev bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    await appwriteTasks.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Görev başarıyla silindi',
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Delete task error', _error, {
      endpoint: '/api/tasks/[id]',
      method: request.method,
      taskId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Görev bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}
