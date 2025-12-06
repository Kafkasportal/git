import { NextRequest, NextResponse } from 'next/server';
import { getServerDatabases } from '@/lib/appwrite/server';
import { appwriteConfig, isServerConfigured } from '@/lib/appwrite/config';
import logger from '@/lib/logger';

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Bulk Assign - Toplu görev atama
 * POST /api/tasks/bulk-assign
 *
 * Body:
 * {
 *   "ids": ["task1", "task2"],
 *   "assigned_to": "user_id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, assigned_to } = body as { ids: string[]; assigned_to: string };

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz ID listesi' },
        { status: 400 }
      );
    }

    if (!assigned_to) {
      return NextResponse.json(
        { error: 'Atanacak kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    // Mock response if Appwrite not configured
    if (!isServerConfigured()) {
      return NextResponse.json({
        success: ids.length,
        failed: 0,
        errors: [],
        message: `${ids.length} görev başarıyla atandı`,
      });
    }

    const db = getServerDatabases();
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Assign tasks in parallel
    const assignPromises = ids.map(async (id) => {
      try {
        await db.updateDocument(
          appwriteConfig.databaseId,
          'tasks',
          id,
          {
            assigned_to,
            status: 'assigned', // Otomatik status güncelleme
            updated_at: new Date().toISOString(),
          }
        );
        return { id, success: true };
      } catch (error) {
        return {
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Atama hatası',
        };
      }
    });

    const results = await Promise.allSettled(assignPromises);

    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        if (res.value.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({ id: res.value.id, error: res.value.error || 'Hata' });
        }
      } else {
        result.failed++;
      }
    });

    logger.info('Bulk assign completed', {
      success: result.success,
      failed: result.failed,
      assigned_to,
    });

    return NextResponse.json({
      ...result,
      message: `${result.success} görev başarıyla atandı`,
    });
  } catch (error) {
    logger.error('Bulk assign error:', error);
    return NextResponse.json(
      { error: 'Toplu atama işlemi başarısız' },
      { status: 500 }
    );
  }
}
