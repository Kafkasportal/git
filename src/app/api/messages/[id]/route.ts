import { NextRequest, NextResponse } from "next/server";
import { appwriteMessages } from "@/lib/appwrite/api";
import logger from "@/lib/logger";
import { extractParams } from "@/lib/api/route-helpers";
import type { MessageDocument, UserDocument } from "@/types/database";

function validateMessageUpdate(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (
    data.message_type &&
    !["sms", "email", "internal"].includes(data.message_type as string)
  ) {
    errors.push("Geçersiz mesaj türü");
  }
  if (
    data.content &&
    typeof data.content === "string" &&
    data.content.trim().length < 3
  ) {
    errors.push("İçerik en az 3 karakter olmalıdır");
  }
  if (
    data.status &&
    !["draft", "sent", "failed"].includes(data.status as string)
  ) {
    errors.push("Geçersiz durum");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * GET /api/messages/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    const message = await appwriteMessages.get(id);

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Mesaj bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (_error) {
    logger.error("Get message error", _error, {
      endpoint: "/api/messages/[id]",
      method: "GET",
      messageId: id,
    });
    return NextResponse.json(
      { success: false, _error: "Veri alınamadı" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/messages/[id]
 */
async function updateMessageHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const validation = validateMessageUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Doğrulama hatası",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const messageData: Parameters<typeof appwriteMessages.update>[1] = {
      subject: body.subject as string | undefined,
      content: body.content as string | undefined,
      status: body.status as "draft" | "sent" | "failed" | undefined,
      sent_at: body.sent_at as string | undefined,
    };

    const updated = await appwriteMessages.update(id, messageData);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Mesaj başarıyla güncellendi",
    });
  } catch (_error) {
    logger.error("Update message error", _error, {
      endpoint: "/api/messages/[id]",
      method: "PUT",
      messageId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : "";
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { success: false, _error: "Mesaj bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, _error: "Güncelleme işlemi başarısız" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/messages/[id]
 */
async function deleteMessageHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    await appwriteMessages.remove(id);

    return NextResponse.json({
      success: true,
      message: "Mesaj başarıyla silindi",
    });
  } catch (_error) {
    logger.error("Delete message error", _error, {
      endpoint: "/api/messages/[id]",
      method: "DELETE",
      messageId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : "";
    if (errorMessage?.includes("not found")) {
      return NextResponse.json(
        { success: false, _error: "Mesaj bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, _error: "Silme işlemi başarısız" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messages/[id]/send
 * Send message via SMS or Email based on message type
 */
async function sendMessageHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    // Get message details
    const message = (await appwriteMessages.get(id)) as MessageDocument | null;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Mesaj bulunamadı" },
        { status: 404 },
      );
    }

    const messageData = message as MessageDocument & {
      recipients?: string[];
      message_type?: string;
      content?: string;
      subject?: string;
      [key: string]: unknown;
    };

    // Get recipient user details (phone/email)
    const { appwriteUsers } = await import("@/lib/appwrite/api");

    const recipients = (await Promise.all(
      message.recipients.map((userId) => appwriteUsers.get(userId)),
    )) as (UserDocument | null)[];

    let sendResult: { success: boolean; error?: string } = { success: false };

    // Send based on message type - SMS devre dışı, sadece email destekleniyor
    if (messageData.message_type === "sms") {
      sendResult = {
        success: false,
        error: "SMS gönderimi şu anda devre dışı",
      };
    } else if (messageData.message_type === "email") {
      const { sendBulkEmails } = await import("@/lib/services/email");
      const emails = recipients
        .map((user: unknown) => (user as { email?: string })?.email)
        .filter(Boolean) as string[];

      if (emails.length === 0) {
        return NextResponse.json(
          { success: false, error: "Alıcıların email adresi bulunamadı" },
          { status: 400 },
        );
      }

      const result = await sendBulkEmails(
        emails,
        messageData.subject || "Mesaj",
        messageData.content || "",
      );
      sendResult = {
        success: result.failed === 0,
        error:
          result.failed > 0
            ? `${result.failed} email gönderilemedi`
            : undefined,
      };
    } else {
      // Internal messages - just update status
      sendResult = { success: true };
    }

    // Update message status
    const updated = await appwriteMessages.update(id, {
      status: sendResult.success ? "sent" : "failed",
      sent_at: sendResult.success ? new Date().toISOString() : undefined,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || "Gönderim işlemi başarısız",
          data: updated,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Mesaj gönderildi",
    });
  } catch (_error: unknown) {
    logger.error("Send message error", _error, {
      endpoint: "/api/messages/[id]",
      method: "POST",
      messageId: id,
    });
    return NextResponse.json(
      { success: false, error: "Gönderim işlemi başarısız" },
      { status: 500 },
    );
  }
}

export const PUT = updateMessageHandler;
export const DELETE = deleteMessageHandler;
export const POST = sendMessageHandler;
