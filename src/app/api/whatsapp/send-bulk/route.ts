import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsapp';

interface BulkRecipient {
  phoneNumber: string;
  message: string;
}

interface SendBulkBody {
  recipients: BulkRecipient[];
  delayMs?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendBulkBody = await request.json();

    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alicilar listesi zorunludur',
        },
        { status: 400 }
      );
    }

    // Validate recipients
    for (const recipient of body.recipients) {
      if (!recipient.phoneNumber || !recipient.message) {
        return NextResponse.json(
          {
            success: false,
            error: 'Her alici icin telefon numarasi ve mesaj zorunludur',
          },
          { status: 400 }
        );
      }
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

    // Default delay is 2 seconds between messages
    const delayMs = body.delayMs ?? 2000;
    const results = await whatsappService.sendBulkMessages(body.recipients, delayMs);

    const successCount = results.filter((r) => r.result.success).length;
    const failedCount = results.filter((r) => !r.result.success).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} mesaj gonderildi, ${failedCount} basarisiz`,
      data: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        results: results.map((r) => ({
          phoneNumber: r.phoneNumber,
          success: r.result.success,
          messageId: r.result.messageId,
          error: r.result.error,
        })),
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
