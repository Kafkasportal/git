import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsapp';

export async function GET() {
  try {
    const whatsappService = getWhatsAppService();
    const state = whatsappService.getState();

    return NextResponse.json({
      success: true,
      data: state,
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
