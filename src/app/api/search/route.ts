import { NextRequest, NextResponse } from 'next/server';
import { getServerDatabases } from '@/lib/appwrite/server';
import { appwriteConfig, isServerConfigured } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';
import logger from '@/lib/logger';

// Generic document type for Appwrite documents
interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  [key: string]: unknown;
}

interface SearchResult {
  id: string;
  type: 'beneficiary' | 'donation' | 'task' | 'meeting' | 'user';
  title: string;
  subtitle?: string;
  href: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const type = searchParams.get('type'); // Optional filter by type

    if (!query.trim()) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Check if Appwrite is configured
    if (!isServerConfigured()) {
      // Return mock data for development
      return NextResponse.json({
        results: getMockResults(query, limit),
        total: 0,
        source: 'mock',
      });
    }

    const db = getServerDatabases();
    const results: SearchResult[] = [];
    const searchLower = query.toLowerCase();

    // Search in parallel
    const searchPromises: Promise<void>[] = [];

    // Search beneficiaries
    if (!type || type === 'beneficiary') {
      searchPromises.push(
        (async () => {
          try {
            const response = await db.listDocuments(
              appwriteConfig.databaseId,
              'beneficiaries',
              [
                Query.limit(limit),
                Query.orderDesc('$createdAt'),
              ]
            );
            
            (response.documents as unknown as AppwriteDocument[]).forEach((doc) => {
              const name = String(doc.name || '');
              const tcNo = String(doc.tc_no || '');
              const phone = String(doc.phone || '');
              
              if (
                name.toLowerCase().includes(searchLower) ||
                tcNo.includes(query) ||
                phone.includes(query)
              ) {
                results.push({
                  id: doc.$id,
                  type: 'beneficiary',
                  title: name,
                  subtitle: `TC: ${tcNo ? `${tcNo.slice(0, 3)}***` : 'N/A'}`,
                  href: `/yardim/ihtiyac-sahipleri/${doc.$id}`,
                  metadata: { status: doc.status },
                });
              }
            });
          } catch (error) {
            logger.error('Beneficiary search error:', error);
          }
        })()
      );
    }

    // Search donations
    if (!type || type === 'donation') {
      searchPromises.push(
        (async () => {
          try {
            const response = await db.listDocuments(
              appwriteConfig.databaseId,
              'donations',
              [
                Query.limit(limit),
                Query.orderDesc('$createdAt'),
              ]
            );
            
            (response.documents as unknown as AppwriteDocument[]).forEach((doc) => {
              const donorName = String(doc.donor_name || '');
              const amount = Number(doc.amount) || 0;
              
              if (
                donorName.toLowerCase().includes(searchLower) ||
                String(amount).includes(query)
              ) {
                results.push({
                  id: doc.$id,
                  type: 'donation',
                  title: donorName,
                  subtitle: `₺${amount?.toLocaleString('tr-TR') || '0'}`,
                  href: `/bagis/liste?id=${doc.$id}`,
                  metadata: { amount, type: doc.donation_type },
                });
              }
            });
          } catch (error) {
            logger.error('Donation search error:', error);
          }
        })()
      );
    }

    // Search tasks
    if (!type || type === 'task') {
      searchPromises.push(
        (async () => {
          try {
            const response = await db.listDocuments(
              appwriteConfig.databaseId,
              'tasks',
              [
                Query.limit(limit),
                Query.orderDesc('$createdAt'),
              ]
            );
            
            (response.documents as unknown as AppwriteDocument[]).forEach((doc) => {
              const title = String(doc.title || '');
              const description = String(doc.description || '');
              
              if (
                title.toLowerCase().includes(searchLower) ||
                description.toLowerCase().includes(searchLower)
              ) {
                results.push({
                  id: doc.$id,
                  type: 'task',
                  title,
                  subtitle: String(doc.status || ''),
                  href: `/is/gorevler?task=${doc.$id}`,
                  metadata: { status: doc.status, priority: doc.priority },
                });
              }
            });
          } catch (error) {
            logger.error('Task search error:', error);
          }
        })()
      );
    }

    // Search meetings
    if (!type || type === 'meeting') {
      searchPromises.push(
        (async () => {
          try {
            const response = await db.listDocuments(
              appwriteConfig.databaseId,
              'meetings',
              [
                Query.limit(limit),
                Query.orderDesc('$createdAt'),
              ]
            );
            
            (response.documents as unknown as AppwriteDocument[]).forEach((doc) => {
              const title = String(doc.title || '');
              const description = String(doc.description || '');
              
              if (
                title.toLowerCase().includes(searchLower) ||
                description.toLowerCase().includes(searchLower)
              ) {
                results.push({
                  id: doc.$id,
                  type: 'meeting',
                  title,
                  subtitle: doc.date ? new Date(String(doc.date)).toLocaleDateString('tr-TR') : '',
                  href: `/is/toplantilar?meeting=${doc.$id}`,
                  metadata: { date: doc.date, status: doc.status },
                });
              }
            });
          } catch (error) {
            logger.error('Meeting search error:', error);
          }
        })()
      );
    }

    // Search users
    if (!type || type === 'user') {
      searchPromises.push(
        (async () => {
          try {
            const response = await db.listDocuments(
              appwriteConfig.databaseId,
              'users',
              [
                Query.limit(limit),
                Query.orderDesc('$createdAt'),
              ]
            );
            
            (response.documents as unknown as AppwriteDocument[]).forEach((doc) => {
              const name = String(doc.name || '');
              const email = String(doc.email || '');
              
              if (
                name.toLowerCase().includes(searchLower) ||
                email.toLowerCase().includes(searchLower)
              ) {
                results.push({
                  id: doc.$id,
                  type: 'user',
                  title: name,
                  subtitle: String(doc.role || ''),
                  href: `/kullanici/${doc.$id}/duzenle`,
                  metadata: { role: doc.role, email },
                });
              }
            });
          } catch (error) {
            logger.error('User search error:', error);
          }
        })()
      );
    }

    await Promise.allSettled(searchPromises);

    // Sort by relevance (exact match first, then partial)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchLower;
      const bExact = b.title.toLowerCase() === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.title.toLowerCase().startsWith(searchLower);
      const bStarts = b.title.toLowerCase().startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query,
    });
  } catch (error) {
    logger.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}

// Mock data for development without Appwrite
function getMockResults(query: string, limit: number): SearchResult[] {
  const mockData: SearchResult[] = [
    { id: '1', type: 'beneficiary' as const, title: 'Ahmet Yılmaz', subtitle: 'TC: 123***', href: '/yardim/ihtiyac-sahipleri/1' },
    { id: '2', type: 'beneficiary' as const, title: 'Fatma Kaya', subtitle: 'TC: 456***', href: '/yardim/ihtiyac-sahipleri/2' },
    { id: '3', type: 'donation' as const, title: 'Mehmet Demir', subtitle: '₺1.500', href: '/bagis/liste?id=3' },
    { id: '4', type: 'donation' as const, title: 'Ayşe Öztürk', subtitle: '₺2.000', href: '/bagis/liste?id=4' },
    { id: '5', type: 'task' as const, title: 'Yardım dağıtımı planla', subtitle: 'Bekliyor', href: '/is/gorevler?task=5' },
    { id: '6', type: 'task' as const, title: 'Rapor hazırla', subtitle: 'Devam ediyor', href: '/is/gorevler?task=6' },
    { id: '7', type: 'meeting' as const, title: 'Yönetim Kurulu Toplantısı', subtitle: '15 Ocak 2024', href: '/is/toplantilar?meeting=7' },
    { id: '8', type: 'user' as const, title: 'Admin Kullanıcı', subtitle: 'Yönetici', href: '/kullanici/8/duzenle' },
  ];

  const searchLower = query.toLowerCase();
  return mockData
    .filter(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.subtitle?.toLowerCase().includes(searchLower)
    )
    .slice(0, limit);
}

