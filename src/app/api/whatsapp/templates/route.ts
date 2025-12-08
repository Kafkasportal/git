import { NextRequest, NextResponse } from 'next/server';
import { MESSAGE_TEMPLATES, getTemplatesByCategory, type TemplateCategory } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as TemplateCategory | null;

    let templates = MESSAGE_TEMPLATES;

    if (category) {
      templates = getTemplatesByCategory(category);
    }

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
