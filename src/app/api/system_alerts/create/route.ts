import { NextRequest, NextResponse } from 'next/server';
import { appwriteSystemAlerts } from '@/lib/appwrite/api';
import logger from '@/lib/logger';

/**
 * POST /api/system_alerts/create
 * Create a system alert (for n8n workflows)
 * Body: { alert_type, severity, title, description, metadata? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_type, severity, title, description, metadata } = body;

    // Validation
    if (!alert_type || !severity || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'alert_type, severity, title, and description are required',
        },
        { status: 400 }
      );
    }

    const validAlertTypes = ['error', 'performance', 'security', 'system'];
    const validSeverities = ['low', 'medium', 'high', 'critical'];

    if (!validAlertTypes.includes(alert_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `alert_type must be one of: ${validAlertTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: `severity must be one of: ${validSeverities.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create alert using Appwrite
    const alertData = {
      alert_type: alert_type as 'error' | 'performance' | 'security' | 'system',
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      title,
      description,
      metadata: metadata || {},
      acknowledged: false,
      resolved: false,
      created_at: new Date().toISOString(),
    };

    const response = await appwriteSystemAlerts.create(alertData);
    const typedResponse = response as { $id?: string; id?: string };
    const result = typedResponse.$id || typedResponse.id || '';

    return NextResponse.json({
      success: true,
      data: { alertId: result },
      message: 'System alert created successfully',
    });
  } catch (error) {
    logger.error('Create system alert error', error, {
      endpoint: '/api/system_alerts/create',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create system alert',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
