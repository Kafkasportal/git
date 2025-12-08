import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsapp';

export async function POST() {
  try {
    const whatsappService = getWhatsAppService();

    await whatsappService.disconnect();

    return NextResponse.json({
      success: true,
      message: 'WhatsApp baglantisi kesildi',
      data: whatsappService.getState(),
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
