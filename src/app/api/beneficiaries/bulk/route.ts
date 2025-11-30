import { NextRequest, NextResponse } from 'next/server';
import { getServerDatabases } from '@/lib/appwrite/server';
import { appwriteConfig, isServerConfigured } from '@/lib/appwrite/config';

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// Bulk DELETE
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz ID listesi' },
        { status: 400 }
      );
    }

    if (!isServerConfigured()) {
      // Mock response for development
      return NextResponse.json({
        success: ids.length,
        failed: 0,
        errors: [],
      });
    }

    const db = getServerDatabases();
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Delete in parallel with Promise.allSettled
    const deletePromises = ids.map(async (id) => {
      try {
        await db.deleteDocument(
          appwriteConfig.databaseId,
          'beneficiaries',
          id
        );
        return { id, success: true };
      } catch (error) {
        return {
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Silme hatası',
        };
      }
    });

    const results = await Promise.allSettled(deletePromises);

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Toplu silme işlemi başarısız' },
      { status: 500 }
    );
  }
}

// Bulk UPDATE (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body as { ids: string[]; updates: Record<string, unknown> };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz ID listesi' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Güncelleme verileri gerekli' },
        { status: 400 }
      );
    }

    if (!isServerConfigured()) {
      // Mock response for development
      return NextResponse.json({
        success: ids.length,
        failed: 0,
        errors: [],
      });
    }

    const db = getServerDatabases();
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Update in parallel with Promise.allSettled
    const updatePromises = ids.map(async (id) => {
      try {
        await db.updateDocument(
          appwriteConfig.databaseId,
          'beneficiaries',
          id,
          {
            ...updates,
            updated_at: new Date().toISOString(),
          }
        );
        return { id, success: true };
      } catch (error) {
        return {
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Güncelleme hatası',
        };
      }
    });

    const results = await Promise.allSettled(updatePromises);

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Toplu güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

