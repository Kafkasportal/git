import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import { appwriteUsers } from "@/lib/appwrite/api";
import { verifyPassword } from "@/lib/auth/password";
import { serializeSessionCookie } from "@/lib/auth/session";
import logger from "@/lib/logger";
import { Query } from "node-appwrite";
import { getServerUsers } from "@/lib/appwrite/server";

/**
 * Test login endpoint - Development only
 * Automatically logs in with test user and redirects to /genel
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  try {
    // Test credential'ları environment'tan al
    // SECURITY: Never use hardcoded fallback credentials
    const email = process.env.MCP_TEST_EMAIL;
    const password = process.env.MCP_TEST_PASSWORD;
    
    if (!email || !password) {
      logger.warn('Test credentials not configured in environment variables');
      return NextResponse.json(
        { error: "Test credentials not configured" },
        { status: 500 },
      );
    }

    // Get user from Appwrite
    const user = await appwriteUsers.getByEmail(email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 401 },
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Şifre hash bulunamadı" },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
    }

    // Resolve Appwrite Auth userId for session consistency
    const serverUsers = getServerUsers();
    const emailLower = email.toLowerCase().trim();
    const authUsers = await serverUsers.list([
      Query.equal("email", emailLower),
      Query.limit(1),
    ]);
    const authUser = authUsers.users?.[0];
    if (!authUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
    }

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1); // 24 hours

    const sessionData = {
      sessionId,
      userId: authUser.$id,
      expire: expireDate.toISOString(),
    };

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Set session cookie
    const signedSession = serializeSessionCookie(sessionData);

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(
        "/genel",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ),
    );

    // Set cookies on response
    const nodeEnv = process.env.NODE_ENV as string;
    const isProduction = nodeEnv === "production";
    response.cookies.set("auth-session", signedSession, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    response.cookies.set("csrf-token", csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error("Test login error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login başarısız" },
      { status: 500 },
    );
  }
}
