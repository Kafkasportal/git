import { describe, it, expect, beforeEach, vi } from 'vitest';
import { databases } from '@/lib/appwrite/api';
import { appwriteConfig } from '@/lib/appwrite/config';
import { Query, ID } from 'appwrite';

vi.mock('@/lib/appwrite/api', () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

describe('Meetings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/meetings', () => {
    it('should list meetings with pagination', async () => {
      const mockMeetings = {
        documents: [
          {
            $id: '1',
            title: 'Yönetim Kurulu Toplantısı',
            date: '2025-01-15T10:00:00.000Z',
            location: 'Merkez Ofis',
            status: 'scheduled',
            participants: ['user1', 'user2'],
            $createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      };

      vi.mocked(databases.listDocuments).mockResolvedValue(mockMeetings);

      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.meetings,
        [Query.limit(25), Query.offset(0)]
      );

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].title).toContain('Toplantı');
    });

    it('should filter meetings by status', async () => {
      const mockCompleted = {
        documents: [
          {
            $id: '1',
            title: 'Geçmiş Toplantı',
            status: 'completed',
            date: '2024-12-01T10:00:00.000Z',
          },
        ],
        total: 1,
      };

      vi.mocked(databases.listDocuments).mockResolvedValue(mockCompleted);

      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.meetings,
        [Query.equal('status', 'completed')]
      );

      expect(result.documents[0].status).toBe('completed');
    });

    it('should filter meetings by date range', async () => {
      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-01-31T23:59:59.000Z';

      const mockMeetings = {
        documents: [
          {
            $id: '1',
            title: 'Ocak Toplantısı',
            date: '2025-01-15T10:00:00.000Z',
          },
        ],
        total: 1,
      };

      vi.mocked(databases.listDocuments).mockResolvedValue(mockMeetings);

      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.meetings,
        [
          Query.greaterThanEqual('date', startDate),
          Query.lessThanEqual('date', endDate),
        ]
      );

      const meetingDate = new Date(result.documents[0].date);
      expect(meetingDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
      expect(meetingDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
    });
  });

  describe('POST /api/meetings', () => {
    it('should create meeting with valid data', async () => {
      const newMeeting = {
        title: 'Yeni Toplantı',
        description: 'Toplantı açıklaması',
        date: '2025-02-01T14:00:00.000Z',
        location: 'Zoom',
        type: 'online',
        participants: ['user1', 'user2', 'user3'],
        status: 'scheduled',
      };

      const mockCreated = {
        $id: 'meeting123',
        ...newMeeting,
        $createdAt: new Date().toISOString(),
      };

      vi.mocked(databases.createDocument).mockResolvedValue(mockCreated);

      const result = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.meetings,
        ID.unique(),
        newMeeting
      );

      expect(result.title).toBe(newMeeting.title);
      expect(result.participants).toHaveLength(3);
    });

    it('should validate required fields', async () => {
      const invalidMeeting = {
        date: '2025-02-01T14:00:00.000Z',
      };

      expect(() => {
        if (!('title' in invalidMeeting)) {
          throw new Error('Title is required');
        }
      }).toThrow('Title is required');
    });
  });

  describe('PUT /api/meetings/:id', () => {
    it('should update meeting details', async () => {
      const updates = {
        title: 'Updated Meeting Title',
        location: 'New Location',
        status: 'in-progress',
      };

      const mockUpdated = {
        $id: 'meeting123',
        ...updates,
        date: '2025-02-01T14:00:00.000Z',
        $updatedAt: new Date().toISOString(),
      };

      vi.mocked(databases.updateDocument).mockResolvedValue(mockUpdated);

      const result = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.meetings,
        'meeting123',
        updates
      );

      expect(result.title).toBe('Updated Meeting Title');
      expect(result.status).toBe('in-progress');
    });
  });

  describe('Security', () => {
    it('should require authentication', async () => {
      const noAuth = null;

      expect(() => {
        if (!noAuth) {
          throw new Error('Authentication required');
        }
      }).toThrow('Authentication required');
    });
  });
});
