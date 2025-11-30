import { NextRequest, NextResponse } from "next/server";
import {
  appwriteFinanceRecords,
  normalizeQueryParams,
} from "@/lib/appwrite/api";
import logger from "@/lib/logger";
import {
  verifyCsrfToken,
  buildErrorResponse,
  requireModuleAccess,
} from "@/lib/api/auth-utils";
import { parseBody } from "@/lib/api/route-helpers";
import { dataModificationRateLimit, readOnlyRateLimit } from "@/lib/rate-limit";
import { financeRecordCreateSchema } from "@/lib/validations/finance-record";
import { z } from "zod";

/**
 * GET /api/finance
 * List all finance records with filtering and pagination
 */
async function getFinanceRecordsHandler(request: NextRequest) {
  try {
    await requireModuleAccess("finance");

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const response = await appwriteFinanceRecords.list({
      ...params,
      record_type:
        (searchParams.get("record_type") as "income" | "expense") || undefined,
      created_by: searchParams.get("created_by") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: response.documents || [],
      total: response.total || 0,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("List finance records error", _error, {
      endpoint: "/api/finance",
      method: "GET",
    });
    return NextResponse.json(
      { success: false, error: "Finans kayıtları alınamadı" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/finance
 * Create a new finance record
 */
async function createFinanceRecordHandler(request: NextRequest) {
  const body: unknown = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("finance");

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return NextResponse.json(
        { success: false, error: parseError },
        { status: 400 },
      );
    }

    // Validate with Zod schema
    const validatedData = financeRecordCreateSchema.parse(body);

    const response = await appwriteFinanceRecords.create(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: "Finans kaydı başarıyla oluşturuldu",
      },
      { status: 201 },
    );
  } catch (_error: unknown) {
    // Handle Zod validation errors
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Doğrulama hatası",
          details: _error.issues.map(
            (e) => `${e.path.join(".")}: ${e.message}`,
          ),
        },
        { status: 400 },
      );
    }

    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Create finance record error", _error, {
      endpoint: "/api/finance",
      method: "POST",
      record_type: (body as Record<string, unknown>)?.record_type,
    });
    return NextResponse.json(
      { success: false, error: "Finans kaydı oluşturma işlemi başarısız" },
      { status: 500 },
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getFinanceRecordsHandler);
export const POST = dataModificationRateLimit(createFinanceRecordHandler);
