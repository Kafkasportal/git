import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsapp';

export async function POST() {
  try {
    const whatsappService = getWhatsAppService();
    const currentState = whatsappService.getState();

    // Already connected or connecting
    if (currentState.status === 'ready') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp zaten bagli',
        data: currentState,
      });
    }

    if (currentState.status === 'connecting' || currentState.status === 'qr_ready') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp baglantisi baslatildi, QR kod bekleniyor',
        data: currentState,
      });
    }

    // Start connection
    await whatsappService.initialize();

    return NextResponse.json({
      success: true,
      message: 'WhatsApp baglantisi baslatildi',
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
