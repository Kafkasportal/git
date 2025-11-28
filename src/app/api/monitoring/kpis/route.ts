import { NextResponse } from 'next/server';
import { serverDatabases } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

export async function GET() {
  try {
    if (!serverDatabases) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { databaseId, collections } = appwriteConfig;

    // Parallel requests for performance
    const [pendingTasks, pendingApplications, upcomingMeetings, activeWorkflows] =
      await Promise.all([
        // Pending Tasks
        serverDatabases.listDocuments(databaseId, collections.tasks, [
          Query.equal('status', 'beklemede'),
          Query.limit(1),
        ]),
        // Pending Aid Applications
        serverDatabases.listDocuments(databaseId, collections.aidApplications, [
          Query.equal('status', 'beklemede'),
          Query.limit(1),
        ]),
        // Upcoming Meetings (future dates)
        serverDatabases.listDocuments(databaseId, collections.meetings, [
          Query.greaterThan('date', new Date().toISOString()),
          Query.limit(1),
        ]),
        // Active Workflows (tracked work items - simplified as 'active' tasks for now)
        serverDatabases.listDocuments(databaseId, collections.tasks, [
          Query.equal('status', 'devam_ediyor'),
          Query.limit(1),
        ]),
      ]);

    // Calculate trends (mocked for now as we don't have historical snapshots)
    // In a real app, you'd compare with yesterday's data or use a separate analytics collection

    const kpis = {
      pendingOperations: {
        total: pendingTasks.total + pendingApplications.total,
        tasks: pendingTasks.total,
        applications: pendingApplications.total,
        trend: 5, // Mock trend
      },
      trackedWorkItems: {
        total: activeWorkflows.total,
        active: activeWorkflows.total,
        trend: 2, // Mock trend
      },
      calendarEvents: {
        total: upcomingMeetings.total,
        upcoming: upcomingMeetings.total,
        trend: 1, // Mock trend
      },
      plannedMeetings: {
        total: upcomingMeetings.total,
        thisWeek: upcomingMeetings.total, // Simplified
      },
    };

    return NextResponse.json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    console.error('KPI fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}
