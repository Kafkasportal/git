/**
 * Appwrite API Base Utilities
 * Common functions for database operations
 */

import { ID, Query } from "appwrite";
import { getServerClient } from "../server";
import { appwriteConfig, type CollectionName } from "../config";
import logger from "@/lib/logger";
import { Databases } from "node-appwrite";

// ============================================================================
// Types
// ============================================================================

export interface AppwriteQueryParams {
  limit?: number;
  skip?: number;
  page?: number;
  search?: string;
  status?: string;
  city?: string;
  [key: string]: unknown;
}

export type AuthContext = {
  auth?: {
    userId: string;
    role: string;
  };
};

// ============================================================================
// Query Utilities
// ============================================================================

/**
 * Convert Next.js query params to Appwrite queries
 */
export function normalizeQueryParams(
  searchParams: URLSearchParams,
): AppwriteQueryParams {
  const params: AppwriteQueryParams = {};

  const limitParam = searchParams.get("limit");
  const skipParam = searchParams.get("skip");
  const pageParam = searchParams.get("page");
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const city = searchParams.get("city");

  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      params.limit = Math.min(parsedLimit, 100);
    }
  }

  if (skipParam) {
    const parsedSkip = parseInt(skipParam, 10);
    if (!Number.isNaN(parsedSkip) && parsedSkip >= 0) {
      params.skip = parsedSkip;
    }
  }

  if (pageParam && params.skip === undefined) {
    const parsedPage = parseInt(pageParam, 10);
    if (!Number.isNaN(parsedPage) && parsedPage > 0) {
      const limit = params.limit ?? 20;
      params.skip = (parsedPage - 1) * limit;
    }
  }

  if (search) params.search = search;
  if (status) params.status = status;
  if (city) params.city = city;

  return params;
}

/**
 * Build Appwrite queries from params
 */
export function buildQueries(params?: AppwriteQueryParams): string[] {
  const queries: string[] = [];

  if (!params) return queries;

  if (params.limit) {
    queries.push(Query.limit(params.limit));
  }

  if (params.skip) {
    queries.push(Query.offset(params.skip));
  }

  if (params.search) {
    // Use OR query to search across multiple fields
    // This works without requiring fulltext index on individual fields
    const searchTerm = params.search.trim();
    if (searchTerm) {
      queries.push(
        Query.or([
          Query.contains("name", searchTerm),
          Query.equal("tc_no", searchTerm),
          Query.contains("phone", searchTerm),
        ])
      );
    }
  }

  if (params.status) {
    queries.push(Query.equal("status", params.status));
  }

  if (params.city) {
    queries.push(Query.equal("city", params.city));
  }

  return queries;
}

// ============================================================================
// Database Access
// ============================================================================

/**
 * Get databases instance
 */
export function getDatabases(): Databases {
  // Use lazy initialization via getServerClient()
  try {
    return new Databases(getServerClient());
  } catch (error) {
    logger.error('Failed to get databases instance - Appwrite not configured', { error });
    throw new Error('Appwrite server client is not configured. Please check your environment variables.');
  }
}

// ============================================================================
// Generic CRUD Operations
// ============================================================================

/**
 * Generic list operation
 */
export async function listDocuments<T>(
  collectionName: CollectionName,
  params?: AppwriteQueryParams,
): Promise<{ documents: T[]; total: number }> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];
  const queries = buildQueries(params);

  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collectionId,
      queries,
    );

    return {
      documents: response.documents as T[],
      total: response.total,
    };
  } catch (error) {
    // Check for Appwrite project_not_found error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = (error as any)?.response || (error as any)?.code;
    
    if (
      errorMessage?.includes('project_not_found') ||
      errorMessage?.includes('Project with the requested ID could not be found') ||
      (typeof errorData === 'object' && errorData?.type === 'project_not_found')
    ) {
      logger.error(`Appwrite project not found when listing ${collectionName}`, {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 8)}...` : '[missing]',
        error: errorMessage,
      });
      throw new Error('Appwrite project not found. Please check your project ID configuration.');
    }
    
    logger.error(`Failed to list ${collectionName}`, { error });
    throw error;
  }
}

/**
 * Generic get operation
 */
export async function getDocument<T>(
  collectionName: CollectionName,
  id: string,
): Promise<T | null> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    const document = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      id,
    );
    return document as T;
  } catch (error) {
    // Check for Appwrite project_not_found error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = (error as any)?.response || (error as any)?.code;
    
    if (
      errorMessage?.includes('project_not_found') ||
      errorMessage?.includes('Project with the requested ID could not be found') ||
      (typeof errorData === 'object' && errorData?.type === 'project_not_found')
    ) {
      logger.error(`Appwrite project not found when getting ${collectionName}`, {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 8)}...` : '[missing]',
        error: errorMessage,
        id,
      });
      throw new Error('Appwrite project not found. Please check your project ID configuration.');
    }
    
    logger.error(`Failed to get ${collectionName}`, { error, id });
    return null;
  }
}

/**
 * Generic create operation
 */
export async function createDocument<T>(
  collectionName: CollectionName,
  data: Record<string, unknown>,
): Promise<T> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    const document = await databases.createDocument(
      appwriteConfig.databaseId,
      collectionId,
      ID.unique(),
      data,
    );
    return document as T;
  } catch (error) {
    // Check for Appwrite project_not_found error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = (error as any)?.response || (error as any)?.code;
    
    if (
      errorMessage?.includes('project_not_found') ||
      errorMessage?.includes('Project with the requested ID could not be found') ||
      (typeof errorData === 'object' && errorData?.type === 'project_not_found')
    ) {
      logger.error(`Appwrite project not found when creating ${collectionName}`, {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 8)}...` : '[missing]',
        error: errorMessage,
      });
      throw new Error('Appwrite project not found. Please check your project ID configuration.');
    }
    
    logger.error(`Failed to create ${collectionName}`, { error });
    throw error;
  }
}

/**
 * Generic update operation
 */
export async function updateDocument<T>(
  collectionName: CollectionName,
  id: string,
  data: Record<string, unknown>,
): Promise<T> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    const document = await databases.updateDocument(
      appwriteConfig.databaseId,
      collectionId,
      id,
      data,
    );
    return document as T;
  } catch (error) {
    // Check for Appwrite project_not_found error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = (error as any)?.response || (error as any)?.code;
    
    if (
      errorMessage?.includes('project_not_found') ||
      errorMessage?.includes('Project with the requested ID could not be found') ||
      (typeof errorData === 'object' && errorData?.type === 'project_not_found')
    ) {
      logger.error(`Appwrite project not found when updating ${collectionName}`, {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 8)}...` : '[missing]',
        error: errorMessage,
        id,
      });
      throw new Error('Appwrite project not found. Please check your project ID configuration.');
    }
    
    logger.error(`Failed to update ${collectionName}`, { error, id });
    throw error;
  }
}

/**
 * Generic delete operation
 */
export async function deleteDocument(
  collectionName: CollectionName,
  id: string,
): Promise<void> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    await databases.deleteDocument(appwriteConfig.databaseId, collectionId, id);
  } catch (error) {
    // Check for Appwrite project_not_found error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = (error as any)?.response || (error as any)?.code;
    
    if (
      errorMessage?.includes('project_not_found') ||
      errorMessage?.includes('Project with the requested ID could not be found') ||
      (typeof errorData === 'object' && errorData?.type === 'project_not_found')
    ) {
      logger.error(`Appwrite project not found when deleting ${collectionName}`, {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 8)}...` : '[missing]',
        error: errorMessage,
        id,
      });
      throw new Error('Appwrite project not found. Please check your project ID configuration.');
    }
    
    logger.error(`Failed to delete ${collectionName}`, { error, id });
    throw error;
  }
}

