import { NextRequest, NextResponse } from "next/server";
import { appwriteScholarships, normalizeQueryParams } from "@/lib/appwrite/api";
import logger from "@/lib/logger";
import {
  verifyCsrfToken,
  buildErrorResponse,
  requireModuleAccess,
  requireAuthenticatedUser,
} from "@/lib/api/auth-utils";
import { parseBody } from "@/lib/api/route-helpers";
import { dataModificationRateLimit, readOnlyRateLimit } from "@/lib/rate-limit";
import { scholarshipCreateSchema } from "@/lib/validations/scholarship";
import { z } from "zod";

/**
 * GET /api/scholarships
 * List all scholarships with filtering and pagination
 * - Authenticated users can view active scholarships
 * - Users with scholarship:access permission can view all scholarships
 */
async function getScholarshipsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("isActive");
    
    // Determine access requirements and filtering
    // - If isActive=true: allow authenticated users, filter to active only
    // - If isActive=false: require module access, filter to inactive only
    // - If isActive not provided: default to active only for authenticated users
    
    let filterIsActive: boolean | undefined = undefined;
    
    if (isActiveParam === "false") {
      // Requesting inactive scholarships - requires module access
      await requireModuleAccess("scholarship");
      filterIsActive = false;
    } else if (isActiveParam === "true") {
      // Explicitly requesting active scholarships - authenticated users can access
      await requireAuthenticatedUser();
      filterIsActive = true;
    } else {
      // No isActive parameter - default to active only for authenticated users
      // This is the most common case and safest default
      await requireAuthenticatedUser();
      filterIsActive = true;
    }

    const params = normalizeQueryParams(searchParams);

    const response = await appwriteScholarships.list({
      ...params,
      category: searchParams.get("category") || undefined,
      isActive: filterIsActive,
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

    logger.error("List scholarships error", _error, {
      endpoint: "/api/scholarships",
      method: "GET",
    });
    return NextResponse.json(
      { success: false, error: "Burs listesi alınamadı" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/scholarships
 * Create a new scholarship
 */
async function createScholarshipHandler(request: NextRequest) {
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess("scholarship");

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return NextResponse.json(
        { success: false, error: parseError },
        { status: 400 },
      );
    }

    // Validate with Zod schema
    const validatedData = scholarshipCreateSchema.parse(body);

    const response = await appwriteScholarships.create(validatedData);

    return NextResponse.json(
      { success: true, data: response, message: "Burs başarıyla oluşturuldu" },
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

    logger.error("Create scholarship error", _error, {
      endpoint: "/api/scholarships",
      method: "POST",
      student_name: (body as Record<string, unknown>)?.student_name,
    });
    return NextResponse.json(
      { success: false, error: "Burs oluşturma işlemi başarısız" },
      { status: 500 },
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getScholarshipsHandler);
export const POST = dataModificationRateLimit(createScholarshipHandler);
