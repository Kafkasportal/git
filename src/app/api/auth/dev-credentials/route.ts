import { NextResponse } from "next/server";
import { appwriteUsers } from "@/lib/appwrite/api";
import logger from "@/lib/logger";

/**
 * GET /api/auth/dev-credentials
 * Get admin user information AND test password for development mode ONLY
 *
 * SECURITY: This endpoint is ONLY available in development mode.
 * The test password is read from a server-side environment variable (not NEXT_PUBLIC_).
 * This ensures the password is never bundled into the client-side code.
 */
export async function GET() {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production", success: false },
      { status: 403 },
    );
  }

  try {
    // Get admin user from database
    const adminEmail = "admin@kafkasder.com";
    const user = await appwriteUsers.getByEmail(adminEmail.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: "Admin kullanıcı bulunamadı", success: false },
        { status: 404 },
      );
    }

    // Get test password from SERVER-SIDE environment variable (not NEXT_PUBLIC_)
    // This is ONLY used for development testing and is never exposed to client bundle
    // SECURITY: Never use hardcoded fallback passwords in production
    const testPassword =
      process.env.ADMIN_TEST_PASSWORD ||
      process.env.MCP_TEST_PASSWORD;
    
    if (!testPassword) {
      logger.warn('Test password not configured in environment variables');
      return NextResponse.json(
        { error: "Test password not configured", success: false },
        { status: 500 },
      );
    }

    // Return admin info WITH test password (development only)
    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        // SECURITY: Password is only returned in development mode via this server API
        testPassword,
      },
    });
  } catch (error) {
    logger.error("Dev credentials error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bilgi alınamadı",
        success: false,
      },
      { status: 500 },
    );
  }
}
