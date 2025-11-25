import { NextRequest, NextResponse } from 'next/server';
import { appwriteTasks, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';
import { parseBody } from '@/lib/api/route-helpers';
import { dataModificationRateLimit, readOnlyRateLimit } from '@/lib/rate-limit';

function validateTask(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
  normalizedData?: Record<string, unknown>;
} {
  const errors: string[] = [];
  if (!data.title || (typeof data.title === 'string' && data.title.trim().length < 3)) {
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

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const normalizedData = {
    ...data,
    status: (data.status as string) || 'pending',
    priority: (data.priority as string) || 'normal',
  };

  return { isValid: true, errors: [], normalizedData };
}

/**
 * GET /api/tasks
 */
async function getTasksHandler(request: NextRequest) {
  try {
    await requireModuleAccess('workflow');

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const response = await appwriteTasks.list({
      ...params,
      assigned_to: searchParams.get('assigned_to') || undefined,
      created_by: searchParams.get('created_by') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: response.documents || [],
      total: response.total || 0,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List tasks error', _error, {
      endpoint: '/api/tasks',
      method: 'GET',
    });
    return NextResponse.json({ success: false, error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 */
async function createTaskHandler(request: NextRequest) {
  const body: unknown = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return NextResponse.json({ success: false, error: parseError }, { status: 400 });
    }
    const validation = validateTask(body as Record<string, unknown>);
    if (!validation.isValid || !validation.normalizedData) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const taskData = {
      title: validation.normalizedData.title || '',
      description: validation.normalizedData.description,
      assigned_to: validation.normalizedData.assigned_to as string | undefined,
      created_by: validation.normalizedData.created_by as string,
      priority: (validation.normalizedData.priority || 'normal') as
        | 'low'
        | 'normal'
        | 'high'
        | 'urgent',
      status: (validation.normalizedData.status || 'pending') as
        | 'pending'
        | 'in_progress'
        | 'completed'
        | 'cancelled',
      due_date: validation.normalizedData.due_date,
      category: validation.normalizedData.category,
      tags: validation.normalizedData.tags,
      is_read: validation.normalizedData.is_read ?? false,
    };

    const response = await appwriteTasks.create(taskData as any);

    return NextResponse.json(
      { success: true, data: response, message: 'Görev başarıyla oluşturuldu' },
      { status: 201 }
    );
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Create task error', _error, {
      endpoint: '/api/tasks',
      method: 'POST',
      title: (body as Record<string, unknown>).title,
    });
    return NextResponse.json(
      { success: false, error: 'Oluşturma işlemi başarısız' },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getTasksHandler);
export const POST = dataModificationRateLimit(createTaskHandler);
