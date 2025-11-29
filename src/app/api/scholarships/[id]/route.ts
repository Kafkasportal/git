import { NextRequest, NextResponse } from "next/server";
import { appwriteScholarships } from "@/lib/appwrite/api";
import { extractParams } from "@/lib/api/route-helpers";
import logger from "@/lib/logger";
import {
  verifyCsrfToken,
  buildErrorResponse,
  requireModuleAccess,
} from "@/lib/api/auth-utils";
import { scholarshipUpdateSchema } from "@/lib/validations/scholarship";
import { z } from "zod";

/**
 * GET /api/scholarships/[id]
 * Get a single scholarship by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    await requireModuleAccess("scholarship");

    const scholarship = await appwriteScholarships.get(id);

    if (!scholarship) {
      return NextResponse.json(
        { success: false, error: "Burs bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: scholarship,
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Get scholarship error", _error, {
      endpoint: "/api/scholarships/[id]",
      method: "GET",
      scholarshipId: id,
    });
    return NextResponse.json(
      { success: false, error: "Burs bilgisi alınamadı" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/scholarships/[id]
 * Update a scholarship
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  let body: unknown = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("scholarship");

    body = (await request.json()) as Record<string, unknown>;

    // Validate with Zod schema
    const validatedData = scholarshipUpdateSchema.parse(body);

    const updated = await appwriteScholarships.update(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Burs başarıyla güncellendi",
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

    logger.error("Update scholarship error", _error, {
      endpoint: "/api/scholarships/[id]",
      method: "PUT",
      scholarshipId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : "";
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Burs bulunamadı" },
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
 * DELETE /api/scholarships/[id]
 * Delete a scholarship
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("scholarship");

    await appwriteScholarships.remove(id);

    return NextResponse.json({
      success: true,
      message: "Burs başarıyla silindi",
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Delete scholarship error", _error, {
      endpoint: "/api/scholarships/[id]",
      method: "DELETE",
      scholarshipId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : "";
    if (errorMessage?.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Burs bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Silme işlemi başarısız" },
      { status: 500 },
    );
  }
}
