import { NextRequest, NextResponse } from 'next/server';
import { appwriteMeetings } from '@/lib/appwrite/api';
import logger from '@/lib/logger';

/**
 * GET /api/meetings/upcoming
 * Get upcoming meetings (for n8n workflows)
 * Query params: from (ISO date), to (ISO date)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'from and to query parameters are required (ISO date format)' },
        { status: 400 }
      );
    }

    // Get all meetings and filter by date range
    const response = await appwriteMeetings.list({});

    // Filter meetings within date range
    const upcomingMeetings = (response.documents || []).filter((meeting) => {
      const meetingDate = new Date(meeting.meeting_date);
      const fromDate = new Date(from);
      const toDate = new Date(to);

      return meetingDate >= fromDate && meetingDate <= toDate && meeting.status === 'scheduled';
    });

    return NextResponse.json({
      success: true,
      data: upcomingMeetings,
      total: upcomingMeetings.length,
    });
  } catch (error) {
    logger.error('Get upcoming meetings error', error, {
      endpoint: '/api/meetings/upcoming',
      method: 'GET',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get upcoming meetings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
