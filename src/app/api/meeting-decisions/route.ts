import { NextRequest, NextResponse } from "next/server";
import {
  appwriteMeetingDecisions,
  normalizeQueryParams,
} from "@/lib/appwrite/api";
import logger from "@/lib/logger";
import {
  verifyCsrfToken,
  buildErrorResponse,
  requireModuleAccess,
} from "@/lib/api/auth-utils";

type DecisionStatus = "acik" | "devam" | "kapatildi";

interface DecisionInput {
  meeting_id: string;
  title: string;
  summary?: string;
  description?: string;
  owner?: string;
  created_by: string;
  status?: DecisionStatus;
  tags?: string[];
  due_date?: string;
}

function validateDecision(data: Record<string, unknown>) {
  const errors: string[] = [];

  if (!data.meeting_id) {
    errors.push("Toplantı ID zorunludur");
  }

  if (
    !data.title ||
    (typeof data.title === "string" && data.title.trim().length < 3)
  ) {
    errors.push("Karar başlığı en az 3 karakter olmalıdır");
  }

  if (!data.created_by) {
    errors.push("Oluşturan kullanıcı zorunludur");
  }

  if (
    data.status &&
    !["acik", "devam", "kapatildi"].includes(data.status as string)
  ) {
    errors.push("Geçersiz karar durumu");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess("workflow");

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const meeting_id = searchParams.get("meeting_id") || undefined;
    const owner = searchParams.get("owner") || undefined;
    const status = searchParams.get("status") as
      | "acik"
      | "devam"
      | "kapatildi"
      | undefined;

    const response = await appwriteMeetingDecisions.list({
      ...(params as Record<string, unknown>),
      meeting_id,
      owner,
      status,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("List meeting decisions error", _error, {
      endpoint: "/api/meeting-decisions",
      method: "GET",
    });

    return NextResponse.json(
      { success: false, error: "Karar listesi alınamadı" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: DecisionInput | null = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("workflow");

    const rawBody = (await request.json()) as Record<string, unknown>;

    const validation = validateDecision(rawBody);
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

    // After validation, safely cast to DecisionInput
    body = rawBody as unknown as DecisionInput;

    const response = await appwriteMeetingDecisions.create({
      meeting_id: body.meeting_id,
      title: body.title,
      summary: body.summary,
      description: body.description ?? "",
      owner: body.owner,
      created_by: body.created_by,
      status: body.status ?? "acik",
      tags: body.tags,
      due_date: body.due_date,
    });

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: "Toplantı kararı oluşturuldu",
      },
      { status: 201 },
    );
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Create meeting decision error", _error, {
      endpoint: "/api/meeting-decisions",
      method: "POST",
      payload: body,
    });

    return NextResponse.json(
      { success: false, error: "Toplantı kararı oluşturulamadı" },
      { status: 500 },
    );
  }
}
