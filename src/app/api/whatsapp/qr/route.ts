import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsapp';

export async function GET() {
  try {
    const whatsappService = getWhatsAppService();
    const state = whatsappService.getState();

    if (state.status === 'ready') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp zaten bagli',
        data: {
          status: state.status,
          phoneNumber: state.phoneNumber,
          qrCode: null,
        },
      });
    }

    if (state.status !== 'qr_ready' || !state.qrCode) {
      return NextResponse.json({
        success: true,
        message: 'QR kod henuz hazir degil',
        data: {
          status: state.status,
          qrCode: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: state.status,
        qrCode: state.qrCode,
      },
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
