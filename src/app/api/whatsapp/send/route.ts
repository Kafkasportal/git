import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsapp';

interface SendMessageBody {
  phoneNumber: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageBody = await request.json();

    if (!body.phoneNumber || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Telefon numarasi ve mesaj zorunludur',
        },
        { status: 400 }
      );
    }

    const whatsappService = getWhatsAppService();

    if (!whatsappService.isReady()) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp baglantisi hazir degil. Lutfen once QR kod ile baglanin.',
        },
        { status: 400 }
      );
    }

    const result = await whatsappService.sendMessage(body.phoneNumber, body.message);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mesaj gonderildi',
      data: {
        messageId: result.messageId,
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
