import { NextRequest, NextResponse } from "next/server";
import { appwriteFinanceRecords } from "@/lib/appwrite/api";
import { extractParams } from "@/lib/api/route-helpers";
import logger from "@/lib/logger";
import {
  verifyCsrfToken,
  buildErrorResponse,
  requireModuleAccess,
} from "@/lib/api/auth-utils";
import { financeRecordUpdateSchema } from "@/lib/validations/finance-record";
import { z } from "zod";

/**
 * GET /api/finance/[id]
 * Get a single finance record by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await requireModuleAccess("finance");

    const financeRecord = await appwriteFinanceRecords.get(id);

    if (!financeRecord) {
      return NextResponse.json(
        { success: false, error: "Finans kaydı bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: financeRecord,
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Get finance record error", _error, {
      endpoint: "/api/finance/[id]",
      method: "GET",
      financeRecordId: id,
    });
    return NextResponse.json(
      { success: false, error: "Finans kaydı alınamadı" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/finance/[id]
 * Update a finance record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  let body: unknown = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("finance");

    body = (await request.json()) as Record<string, unknown>;

    // Validate with Zod schema
    const validatedData = financeRecordUpdateSchema.parse(body);

    const updated = await appwriteFinanceRecords.update(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Finans kaydı başarıyla güncellendi",
    });
  } catch (_error) {
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

    logger.error("Update finance record error", _error, {
      endpoint: "/api/finance/[id]",
      method: "PUT",
      financeRecordId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : "";
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Finans kaydı bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Güncelleme işlemi başarısız" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/finance/[id]
 * Delete a finance record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("finance");

    await appwriteFinanceRecords.remove(id);

    return NextResponse.json({
      success: true,
      message: "Finans kaydı başarıyla silindi",
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Delete finance record error", _error, {
      endpoint: "/api/finance/[id]",
      method: "DELETE",
      financeRecordId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : "";
    if (errorMessage?.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Finans kaydı bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Silme işlemi başarısız" },
      { status: 500 },
    );
  }
}
