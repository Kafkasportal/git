/**
 * Appwrite API Client
 *
 * Generic CRUD operations for Appwrite database.
 * Provides a unified interface for CRUD operations.
 */

import { ID, Query, type Models } from 'appwrite';
import { databases, isAppwriteReady } from './client';
import { appwriteConfig, type CollectionName } from './config';
import type { ConvexResponse, QueryParams, CreateDocumentData, UpdateDocumentData } from '@/types/database';
import logger from '@/lib/logger';

// Type for Appwrite document
export type AppwriteDocument = Models.Document;

/**
 * Convert query params to Appwrite queries
 */
function buildAppwriteQueries(params?: QueryParams): string[] {
  const queries: string[] = [];

  if (!params) return queries;

  // Pagination
  if (params.limit) {
    queries.push(Query.limit(params.limit));
  }

  if (params.page && params.limit) {
    const offset = (params.page - 1) * params.limit;
    queries.push(Query.offset(offset));
  }

  // Search (uses Appwrite's search functionality)
  if (params.search) {
    queries.push(Query.search('name', params.search));
  }

  // Filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          queries.push(Query.equal(key, value));
        } else if (typeof value === 'number') {
          queries.push(Query.equal(key, value));
        } else {
          queries.push(Query.equal(key, String(value)));
        }
      }
    });
  }

  return queries;
}

/**
 * Generic CRUD operations interface for Appwrite
 */
export interface AppwriteCrudOperations<T> {
  list: (params?: QueryParams) => Promise<ConvexResponse<T[]>>;
  get: (id: string) => Promise<ConvexResponse<T>>;
  create: (data: CreateDocumentData<T>) => Promise<ConvexResponse<T>>;
  update: (id: string, data: UpdateDocumentData<T>) => Promise<ConvexResponse<T>>;
  delete: (id: string) => Promise<ConvexResponse<null>>;
  count: (params?: QueryParams) => Promise<number>;
}

/**
 * Create CRUD operations for an Appwrite collection
 */
export function createAppwriteCrudOperations<T extends AppwriteDocument>(
  collectionName: CollectionName
): AppwriteCrudOperations<T> {
  const collectionId = appwriteConfig.collections[collectionName];
  const databaseId = appwriteConfig.databaseId;

  return {
    async list(params?: QueryParams): Promise<ConvexResponse<T[]>> {
      if (!isAppwriteReady() || !databases) {
        return {
          data: null,
          error: 'Appwrite not configured',
        };
      }

      try {
        const queries = buildAppwriteQueries(params);
        const response = await databases.listDocuments(databaseId, collectionId, queries);

        return {
          data: response.documents as unknown as T[],
          error: null,
          total: response.total,
        };
      } catch (error) {
        logger.error(`Failed to list ${collectionName}`, { error });
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        };
      }
    },

    async get(id: string): Promise<ConvexResponse<T>> {
      if (!isAppwriteReady() || !databases) {
        return {
          data: null,
          error: 'Appwrite not configured',
        };
      }

      try {
        const document = await databases.getDocument(databaseId, collectionId, id);

        return {
          data: document as unknown as T,
          error: null,
        };
      } catch (error) {
        logger.error(`Failed to get ${collectionName} by id`, { error, id });
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        };
      }
    },

    async create(data: CreateDocumentData<T>): Promise<ConvexResponse<T>> {
      if (!isAppwriteReady() || !databases) {
        return {
          data: null,
          error: 'Appwrite not configured',
        };
      }

      try {
        const document = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          data as Record<string, unknown>
        );

        return {
          data: document as unknown as T,
          error: null,
        };
      } catch (error) {
        logger.error(`Failed to create ${collectionName}`, { error });
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to create document',
        };
      }
    },

    async update(id: string, data: UpdateDocumentData<T>): Promise<ConvexResponse<T>> {
      if (!isAppwriteReady() || !databases) {
        return {
          data: null,
          error: 'Appwrite not configured',
        };
      }

      try {
        const document = await databases.updateDocument(
          databaseId,
          collectionId,
          id,
          data as Record<string, unknown>
        );

        return {
          data: document as unknown as T,
          error: null,
        };
      } catch (error) {
        logger.error(`Failed to update ${collectionName}`, { error, id });
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to update document',
        };
      }
    },

    async delete(id: string): Promise<ConvexResponse<null>> {
      if (!isAppwriteReady() || !databases) {
        return {
          data: null,
          error: 'Appwrite not configured',
        };
      }

      try {
        await databases.deleteDocument(databaseId, collectionId, id);

        return {
          data: null,
          error: null,
        };
      } catch (error) {
        logger.error(`Failed to delete ${collectionName}`, { error, id });
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to delete document',
        };
      }
    },

    async count(params?: QueryParams): Promise<number> {
      if (!isAppwriteReady() || !databases) {
        return 0;
      }

      try {
        const queries = buildAppwriteQueries(params);
        const response = await databases.listDocuments(databaseId, collectionId, [
          ...queries,
          Query.limit(1),
        ]);

        return response.total;
      } catch (error) {
        logger.error(`Failed to count ${collectionName}`, { error });
        return 0;
      }
    },
  };
}

// Pre-configured CRUD operations for common entities
export const appwriteBeneficiaries = createAppwriteCrudOperations<AppwriteDocument>('beneficiaries');
export const appwriteDonations = createAppwriteCrudOperations<AppwriteDocument>('donations');
export const appwriteTasks = createAppwriteCrudOperations<AppwriteDocument>('tasks');
export const appwriteUsers = createAppwriteCrudOperations<AppwriteDocument>('users');
export const appwriteMeetings = createAppwriteCrudOperations<AppwriteDocument>('meetings');
export const appwriteMessages = createAppwriteCrudOperations<AppwriteDocument>('messages');
export const appwriteAidApplications = createAppwriteCrudOperations<AppwriteDocument>('aidApplications');
export const appwritePartners = createAppwriteCrudOperations<AppwriteDocument>('partners');
export const appwriteScholarships = createAppwriteCrudOperations<AppwriteDocument>('scholarships');
export const appwriteFinanceRecords = createAppwriteCrudOperations<AppwriteDocument>('financeRecords');
export const appwriteErrors = createAppwriteCrudOperations<AppwriteDocument>('errors');
export const appwriteAuditLogs = createAppwriteCrudOperations<AppwriteDocument>('auditLogs');
export const appwriteCommunicationLogs = createAppwriteCrudOperations<AppwriteDocument>('communicationLogs');
export const appwriteSystemAlerts = createAppwriteCrudOperations<AppwriteDocument>('systemAlerts');
export const appwriteSecurityEvents = createAppwriteCrudOperations<AppwriteDocument>('securityEvents');
export const appwriteSystemSettings = createAppwriteCrudOperations<AppwriteDocument>('systemSettings');
export const appwriteParameters = createAppwriteCrudOperations<AppwriteDocument>('parameters');

// Export for custom collections
export { createAppwriteCrudOperations as createAppwriteApiClient };
