import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

/**
 * GET /api/csrf
 * Generate and return a CSRF token
 * The token is set in a cookie and also returned in the response
 */
export async function GET() {
  try {
    const csrfToken = generateCsrfToken();
    const cookieStore = await cookies();

    // Set CSRF token cookie (client-readable)
    cookieStore.set('csrf-token', csrfToken, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      token: csrfToken,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
