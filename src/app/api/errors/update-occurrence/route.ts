import { NextRequest, NextResponse } from 'next/server';
import { appwriteErrors } from '@/lib/appwrite/api';
import logger from '@/lib/logger';

/**
 * POST /api/errors/update-occurrence
 * Update error occurrence count (for n8n workflows)
 * Body: { error_id: string, occurrence_count?: number, last_seen?: string, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error_id, occurrence_count, last_seen, ...otherUpdates } = body;

    if (!error_id) {
      return NextResponse.json({ success: false, error: 'error_id is required' }, { status: 400 });
    }

    // Get current error
    const currentError = await appwriteErrors.get(error_id);

    if (!currentError) {
      return NextResponse.json({ success: false, error: 'Error not found' }, { status: 404 });
    }

    // Update error with new occurrence data
    const updateData: Record<string, unknown> = {};

    if (occurrence_count !== undefined) {
      updateData.occurrence_count = occurrence_count;
    }

    if (last_seen) {
      updateData.last_seen = last_seen;
    }

    // Update metadata if other updates provided
    if (Object.keys(otherUpdates).length > 0) {
      updateData.metadata = {
        ...((currentError as any).metadata || {}),
        ...otherUpdates,
      };
    }

    // Update the error record
    const result = await appwriteErrors.update(error_id, updateData);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Error occurrence updated successfully',
    });
  } catch (error) {
    logger.error('Update error occurrence error', error, {
      endpoint: '/api/errors/update-occurrence',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update error occurrence',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
