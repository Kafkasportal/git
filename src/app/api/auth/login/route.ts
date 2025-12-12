import { NextRequest, NextResponse } from "next/server";
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";
import { cookies } from "next/headers";
import { authRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import { appwriteUsers } from "@/lib/appwrite/api";
import { serializeSessionCookie } from "@/lib/auth/session";
import { Client, Account } from "node-appwrite";
import {
  isAccountLocked,
  getRemainingLockoutTime,
  recordLoginAttempt,
  getFailedAttemptCount,
  LOCKOUT_CONFIG,
} from "@/lib/auth/account-lockout";

/**
 * POST /api/auth/login
 * Handle user login with Appwrite authentication
 *
 * Verifies credentials using Appwrite Client SDK on server-side
 */
export const POST = authRateLimit(async (request: NextRequest) => {
  let email: string | undefined;

  try {
    const headerToken = request.headers.get("x-csrf-token") || "";
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf-token")?.value || "";

    if (!validateCsrfToken(headerToken, cookieToken)) {
      return NextResponse.json(
        { success: false, error: "Güvenlik doğrulaması başarısız" },
        { status: 403 },
      );
    }

    const body = await request.json();
    email = body.email;
    const { password, rememberMe = false } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email ve şifre gereklidir" },
        { status: 400 },
      );
    }

    // Check if account is locked due to failed attempts
    if (isAccountLocked(email)) {
      const remainingSeconds = getRemainingLockoutTime(email);
      const minutes = Math.ceil(remainingSeconds / 60);

      logger.warn("Login blocked - account locked", {
        email: `${email?.substring(0, 3)}***`,
        remainingSeconds,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Hesap geçici olarak kilitlendi. ${minutes} dakika sonra tekrar deneyin.`,
          locked: true,
          remainingSeconds,
        },
        { status: 429 },
      );
    }

    // Verify Credentials using Appwrite Auth
    // We create a temporary client without API key to act as a user and attempt login
    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

      const account = new Account(client);
      await account.createEmailPasswordSession(email, password);
      // Valid credentials
    } catch (_authError: unknown) {
      // Record failed attempt
      recordLoginAttempt(email, false);
      const failedAttempts = getFailedAttemptCount(email);
      const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

      logger.warn("Login failed - invalid credentials", {
        email: `${email?.substring(0, 3)}***`,
        failedAttempts,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Geçersiz email veya şifre",
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 },
      );
    }

    // Credentials valid, now fetch full user details from Admin API
    // We do this to get permissions, roles, and status
    const emailLower = email.toLowerCase();
    const user = await appwriteUsers.getByEmail(emailLower);

    if (!user) {
      // Should theoretically not happen if auth succeeded, but possible if DB sync is off
      return NextResponse.json(
        { success: false, error: "Kullanıcı profili bulunamadı" },
        { status: 404 },
      );
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn("Login failed - inactive account", {
        email: `${email?.substring(0, 3)}***`,
      });
      return NextResponse.json(
        { success: false, error: "Hesap aktif değil" },
        { status: 403 },
      );
    }

    // Record successful login (clears failed attempts)
    recordLoginAttempt(email, true);

    const userId = user.$id || user._id || "";
    const userData = {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role || "Personel",
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      isActive: user.isActive,
      createdAt:
        user.$createdAt || user._creationTime || new Date().toISOString(),
      updatedAt: user.$updatedAt || user._updatedAt || new Date().toISOString(),
      phone: user.phone,
      labels: user.labels ?? [],
    };

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Ensure SESSION_SECRET is configured (required for signed cookies)
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 16) {
      // Make a temporary secret if logical but ideally warn
      // For now returning error as safer
      logger.error("SESSION_SECRET missing or too short");
      // Don't fail the request in dev/demo if possible, but security first.
      if (process.env.NODE_ENV === "development") {
        // allow weak secret in dev?
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Sunucu yapılandırması eksik (SESSION_SECRET)",
          },
          { status: 500 },
        );
      }
    }

    // Set session cookies (signed)

    // Create session
    const expireTime = new Date(
      Date.now() +
        (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
    );
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const signedSession = serializeSessionCookie({
      sessionId,
      userId,
      expire: expireTime.toISOString(),
    });

    // Session cookie (HttpOnly)
    cookieStore.set("auth-session", signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
    });

    // CSRF token cookie
    cookieStore.set("csrf-token", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    // Update last login time
    try {
      await appwriteUsers.update(userId, {
        lastLogin: new Date().toISOString(),
      });
    } catch (_error) {
      // Log but don't fail login if this fails
      logger.warn("Failed to update last login time", {
        error: _error,
        userId,
      });
    }

    logger.info("User logged in successfully", {
      userId,
      email: `${email?.substring(0, 3)}***`,
      role: userData.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: {
          sessionId,
          expire: expireTime.toISOString(),
        },
      },
    });
  } catch (_error: unknown) {
    const errorMessage =
      _error instanceof Error
        ? _error.message
        : "Giriş yapılırken bir hata oluştu";

    logger.error("Login error", _error, {
      endpoint: "/api/auth/login",
      method: "POST",
      email: `${email?.substring(0, 3)}***`,
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
});
