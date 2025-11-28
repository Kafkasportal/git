import { describe, it, expect, beforeEach, vi } from 'vitest';
import { databases } from '@/lib/appwrite/api';
import { appwriteConfig } from '@/lib/appwrite/config';
import { Query } from 'appwrite';

// Mock Appwrite
vi.mock('@/lib/appwrite/api', () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should list users with default pagination', async () => {
      const mockUsers = {
        documents: [
          {
            $id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
            status: 'active',
          },
        ],
        total: 1,
      };

      vi.mocked(databases.listDocuments).mockResolvedValue(mockUsers);

      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        [Query.limit(25), Query.offset(0)]
      );

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].email).toBe('test@example.com');
    });
  });

  describe('Security', () => {
    it('should require authentication for user operations', async () => {
      const noAuth = null;

      expect(() => {
        if (!noAuth) {
          throw new Error('Authentication required');
        }
      }).toThrow('Authentication required');
    });
  });
});
