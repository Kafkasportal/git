import { NextRequest, NextResponse } from 'next/server';
import { getServerDatabases } from '@/lib/appwrite/server';
import { appwriteConfig, isServerConfigured } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';
import logger from '@/lib/logger';
import type { Activity, ActivityType } from '@/lib/activity/types';

// Document type for activity logs
interface ActivityDocument {
  $id: string;
  $createdAt: string;
  type: string;
  title: string;
  description?: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  metadata?: Record<string, unknown>;
}

// Mock activities for development
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'donation_created',
    title: 'Yeni bağış alındı',
    description: 'Ahmet Yılmaz tarafından ₺5.000 bağış yapıldı.',
    user: { id: '1', name: 'Sistem', avatar: undefined },
    resourceType: 'donation',
    resourceId: 'don-1',
    resourceName: 'Ahmet Yılmaz',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'beneficiary_created',
    title: 'Yeni ihtiyaç sahibi eklendi',
    description: 'Fatma Kaya sisteme kayıt edildi.',
    user: { id: '2', name: 'Admin', avatar: undefined },
    resourceType: 'beneficiary',
    resourceId: 'ben-1',
    resourceName: 'Fatma Kaya',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'task_completed',
    title: 'Görev tamamlandı',
    description: 'Yardım dağıtımı planlaması tamamlandı.',
    user: { id: '3', name: 'Mehmet Demir', avatar: undefined },
    resourceType: 'task',
    resourceId: 'task-1',
    resourceName: 'Yardım dağıtımı',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    type: 'meeting_created',
    title: 'Yeni toplantı planlandı',
    description: 'Yönetim kurulu toplantısı 15 Ocak için planlandı.',
    user: { id: '4', name: 'Ayşe Öztürk', avatar: undefined },
    resourceType: 'meeting',
    resourceId: 'meet-1',
    resourceName: 'Yönetim Kurulu',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5',
    type: 'aid_approved',
    title: 'Yardım başvurusu onaylandı',
    description: 'Ali Veli\'nin yardım başvurusu onaylandı.',
    user: { id: '5', name: 'Komisyon', avatar: undefined },
    resourceType: 'aid',
    resourceId: 'aid-1',
    resourceName: 'Ali Veli',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // Filter by resource type

    if (!isServerConfigured()) {
      // Return mock data for development
      let activities = mockActivities;
      
      if (type && type !== 'all') {
        activities = activities.filter((a) => a.resourceType === type);
      }

      return NextResponse.json({
        activities: activities.slice(offset, offset + limit),
        total: activities.length,
        hasMore: offset + limit < activities.length,
      });
    }

    const db = getServerDatabases();
    
    // Build query
    const queries = [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];

    // Fetch from activity_logs collection if it exists
    try {
      const response = await db.listDocuments(
        appwriteConfig.databaseId,
        'activity_logs',
        queries
      );

      const activities: Activity[] = (response.documents as unknown as ActivityDocument[]).map((doc) => ({
        id: doc.$id,
        type: doc.type as ActivityType,
        title: doc.title,
        description: doc.description,
        user: doc.user_id
          ? {
              id: doc.user_id,
              name: doc.user_name || 'Unknown',
              avatar: doc.user_avatar,
            }
          : undefined,
        resourceType: doc.resource_type as Activity['resourceType'],
        resourceId: doc.resource_id,
        resourceName: doc.resource_name,
        metadata: doc.metadata,
        createdAt: doc.$createdAt,
      }));

      return NextResponse.json({
        activities,
        total: response.total,
        hasMore: offset + limit < response.total,
      });
    } catch {
      // Collection doesn't exist, return mock data
      return NextResponse.json({
        activities: mockActivities.slice(offset, offset + limit),
        total: mockActivities.length,
        hasMore: offset + limit < mockActivities.length,
      });
    }
  } catch (error) {
    logger.error('Activity API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', activities: [] },
      { status: 500 }
    );
  }
}

