import { NextRequest, NextResponse } from "next/server";
import { appwriteScholarships } from "@/lib/appwrite/api";
import logger from "@/lib/logger";
import { buildErrorResponse, requireModuleAccess } from "@/lib/api/auth-utils";
import { readOnlyRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/scholarships/statistics
 * Get scholarship application statistics
 */
async function getScholarshipStatisticsHandler(request: NextRequest) {
  try {
    await requireModuleAccess("scholarship");

    const { searchParams } = new URL(request.url);
    const scholarshipId = searchParams.get("scholarshipId") || undefined;

    const statistics = await appwriteScholarships.getStatistics(scholarshipId);

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Get scholarship statistics error", _error, {
      endpoint: "/api/scholarships/statistics",
      method: "GET",
    });
    return NextResponse.json(
      { success: false, error: "İstatistikler alınamadı" },
      { status: 500 },
    );
  }
}

// Export handler with rate limiting
export const GET = readOnlyRateLimit(getScholarshipStatisticsHandler);
