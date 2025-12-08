/**
 * Edge-Compatible Session Utilities
 * Uses Web Crypto API instead of Node.js crypto for Edge Runtime compatibility
 */

import type { NextRequest } from "next/server";

export interface AuthSession {
  sessionId: string;
  userId: string;
  expire?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions: string[];
  isActive: boolean;
  labels?: string[];
}

/**
 * HMAC-SHA256 using Web Crypto API (Edge-compatible)
 */
async function signPayloadEdge(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time comparison using Web Crypto API (Edge-compatible)
 */
function safeEqualEdge(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Parse legacy JSON session format (for backward compatibility)
 */
function parseLegacySession(cookieValue?: string): AuthSession | null {
  if (!cookieValue) return null;
  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded) as AuthSession & { isDemo?: boolean };
    
    // Handle demo session
    if (parsed?.isDemo && parsed?.userId) {
      return {
        sessionId: parsed.sessionId || 'demo-session-001',
        userId: parsed.userId,
        expire: parsed.expire,
      };
    }
    
    if (!parsed?.sessionId || !parsed?.userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Parse and verify signed session cookie (Edge-compatible)
 */
export async function parseAuthSessionEdge(
  cookieValue?: string,
): Promise<AuthSession | null> {
  if (!cookieValue) {
    return null;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    // Fall back to legacy parsing if no secret configured
    return parseLegacySession(cookieValue);
  }

  // Signed format: payload.signature
  const [payload, signature] = cookieValue.split(".");

  if (payload && signature) {
    try {
      // Verify signature using Web Crypto
      const expectedSig = await signPayloadEdge(payload, secret);
      if (!safeEqualEdge(signature, expectedSig)) {
        return null;
      }

      // Decode base64url payload with padding fix
      let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      // Add padding if needed
      while (base64.length % 4) {
        base64 += "=";
      }
      const jsonString = atob(base64);
      const parsed = JSON.parse(jsonString) as AuthSession;

      if (!parsed?.sessionId || !parsed?.userId) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  // Legacy JSON (unsigned) fallback
  return parseLegacySession(cookieValue);
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session?.expire) {
    return false;
  }

  const expireDate = new Date(session.expire);
  return Number.isNaN(expireDate.getTime())
    ? false
    : expireDate.getTime() < Date.now();
}

/**
 * Extract auth-session cookie from NextRequest (Edge-compatible)
 */
export async function getAuthSessionFromRequestEdge(
  request: NextRequest,
): Promise<AuthSession | null> {
  const cookieValue = request.cookies.get("auth-session")?.value;
  return await parseAuthSessionEdge(cookieValue);
}
