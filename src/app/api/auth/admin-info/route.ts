import { NextResponse } from 'next/server';
import { appwriteUsers } from '@/lib/appwrite/api';
import logger from '@/lib/logger';

/**
 * GET /api/auth/admin-info
 * Get admin user information for test login (development only)
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    // Get admin user from database
    const adminEmail = 'admin@kafkasder.com';
    const user = await appwriteUsers.getByEmail(adminEmail.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: 'Admin kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Return admin info (without password hash)
    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        // Note: Password is not returned for security
        // Use environment variable NEXT_PUBLIC_ADMIN_TEST_PASSWORD or MCP_TEST_PASSWORD
      },
    });
  } catch (error) {
    logger.error('Admin info error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilgi alınamadı' },
      { status: 500 }
    );
  }
}

