import { NextResponse } from 'next/server';
import { serverDatabases, serverUsers } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

export async function GET() {
  try {
    if (!serverDatabases || !serverUsers) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { databaseId, collections } = appwriteConfig;

    // Calculate date for "recent" (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString();

    const [
      beneficiariesTotal,
      beneficiariesRecent,
      donationsTotal,
      donationsRecent,
      donationsAmount, // We need to fetch amounts to sum them
      usersTotal,
    ] = await Promise.all([
      // Total Beneficiaries
      serverDatabases.listDocuments(databaseId, collections.beneficiaries, [Query.limit(1)]),
      // Recent Beneficiaries
      serverDatabases.listDocuments(databaseId, collections.beneficiaries, [
        Query.greaterThan('$createdAt', dateString),
        Query.limit(1),
      ]),
      // Total Donations
      serverDatabases.listDocuments(databaseId, collections.donations, [Query.limit(1)]),
      // Recent Donations
      serverDatabases.listDocuments(databaseId, collections.donations, [
        Query.greaterThan('$createdAt', dateString),
        Query.limit(1),
      ]),
      // Donation Amounts (Fetch last 50 to sum - optimized for better performance)
      serverDatabases.listDocuments(databaseId, collections.donations, [
        Query.limit(50), // Reduced from 100
        Query.orderDesc('$createdAt'),
        Query.select(['amount']), // Only fetch amount field
      ]),
      // Active Users (using serverUsers API)
      serverUsers.list([Query.limit(1)]),
    ]);

    // Calculate total amount from the sample
    const totalAmount = donationsAmount.documents.reduce((sum, doc) => sum + (doc.amount || 0), 0);

    const stats = {
      beneficiaries: {
        total: beneficiariesTotal.total,
        recent: beneficiariesRecent.total,
      },
      donations: {
        total: donationsTotal.total,
        recent: donationsRecent.total,
        totalAmount, // This is an approximation based on last 100
      },
      users: {
        active: usersTotal.total,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
