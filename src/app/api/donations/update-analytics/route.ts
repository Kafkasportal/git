import { NextRequest, NextResponse } from 'next/server';
import { appwriteDonations } from '@/lib/appwrite/api';
import logger from '@/lib/logger';

/**
 * POST /api/donations/update-analytics
 * Update donation analytics (for n8n workflows)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donation_id, analytics_data } = body;

    if (!donation_id) {
      return NextResponse.json(
        { success: false, error: 'donation_id is required' },
        { status: 400 }
      );
    }

    // Update donation with analytics data using Appwrite
    const result = await appwriteDonations.update(donation_id, analytics_data);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Analytics updated successfully',
    });
  } catch (error) {
    logger.error('Update donation analytics error', error, {
      endpoint: '/api/donations/update-analytics',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
