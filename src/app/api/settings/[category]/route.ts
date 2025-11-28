import { NextRequest, NextResponse } from 'next/server';
import { appwriteSystemSettings } from '@/lib/appwrite/api';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';

// GET - Get settings for a specific category
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    const settings = await appwriteSystemSettings.getByCategory(category);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (_error) {
    logger.error('Settings category GET error', _error);
    return NextResponse.json(
      { error: _error instanceof Error ? _error.message : 'Ayarlar alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Update settings for a category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Geçersiz ayarlar formatı' }, { status: 400 });
    }

    const { user } = await requireAuthenticatedUser();
    await appwriteSystemSettings.updateSettings(category, settings, user.id);

    return NextResponse.json({
      success: true,
      message: `${category} ayarları başarıyla güncellendi`,
    });
  } catch (_error) {
    logger.error('Settings category POST error', _error);
    return NextResponse.json(
      { error: _error instanceof Error ? _error.message : 'Ayarlar kaydedilirken hata oluştu' },
      { status: 500 }
    );
  }
}
