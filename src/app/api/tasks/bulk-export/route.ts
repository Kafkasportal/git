import { NextRequest, NextResponse } from 'next/server';
import { getServerDatabases } from '@/lib/appwrite/server';
import { appwriteConfig, isServerConfigured } from '@/lib/appwrite/config';
import logger from '@/lib/logger';
import type { TaskDocument } from '@/types/database';

// Helper to convert task to plain object
function taskToPlainObject(task: TaskDocument): Record<string, unknown> {
  return {
    id: task._id || task.$id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to,
    due_date: task.due_date,
    category: task.category,
    created_at: task._creationTime || task.$createdAt,
  };
}

// Helper to generate CSV string
function generateCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';

  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map((row) =>
    keys.map((key) => {
      const value = row[key];
      const str = String(value ?? '');
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  return `\uFEFF${[header, ...rows].join('\n')}`;
}

/**
 * Bulk Export - Seçili görevleri dışa aktar
 * POST /api/tasks/bulk-export
 *
 * Body:
 * {
 *   "ids": ["task1", "task2"],
 *   "format": "csv" | "excel" | "pdf"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, format = 'csv' } = body as { ids: string[]; format: 'csv' | 'excel' | 'pdf' };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz ID listesi' },
        { status: 400 }
      );
    }

    if (!isServerConfigured()) {
      // Mock response
      const mockData = ids.map((id, index) => ({
        id,
        title: `Mock Görev ${index + 1}`,
        status: 'pending',
        priority: 'normal',
        assigned_to: '',
        due_date: new Date().toISOString(),
        category: 'General',
        created_at: new Date().toISOString(),
      }));

      if (format === 'pdf') {
        // For PDF, return simple text for now
        return new NextResponse('PDF export not implemented', {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      } else {
        const csv = generateCSV(mockData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
            'Content-Disposition': `attachment; filename="gorevler.${format === 'excel' ? 'xlsx' : 'csv'}"`,
          },
        });
      }
    }

    const db = getServerDatabases();

    // Fetch all selected tasks
    const tasks: Record<string, unknown>[] = [];
    for (const id of ids) {
      try {
        const task = await db.getDocument(
          appwriteConfig.databaseId,
          'tasks',
          id
        );
        tasks.push(taskToPlainObject(task as any as TaskDocument));
      } catch (error) {
        logger.warn('Task not found for export', { id, error });
      }
    }

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'Dışa aktarılacak görev bulunamadı' },
        { status: 404 }
      );
    }

    // Export based on format
    if (format === 'pdf') {
      // For PDF, return simple text for now (can be implemented later with jspdf)
      return new NextResponse('PDF export not implemented', {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } else {
      // CSV or Excel (both use CSV format)
      const csv = generateCSV(tasks);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
          'Content-Disposition': `attachment; filename="gorevler-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}"`,
        },
      });
    }
  } catch (error) {
    logger.error('Bulk export error:', error);
    return NextResponse.json(
      { error: 'Dışa aktarma işlemi başarısız' },
      { status: 500 }
    );
  }
}
