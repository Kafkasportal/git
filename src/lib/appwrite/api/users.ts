/**
 * Users API Module
 */

import { Query } from "appwrite";
import {
  getDatabases,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";
import { appwriteConfig } from "../config";
import type { UserCreateInput, UserUpdateInput } from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Users API
 */
export const appwriteUsers = {
  list: async (params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
    cursor?: string;
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.users;
    const queries: string[] = [];

    if (params?.limit) {
      queries.push(Query.limit(params.limit));
    }
    if (params?.role) {
      queries.push(Query.equal("role", params.role));
    }
    if (params?.isActive !== undefined) {
      queries.push(Query.equal("isActive", params.isActive));
    }
    if (params?.search) {
      queries.push(Query.search("name", params.search));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries,
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error("Failed to list users", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("users", id);
  },

  getByEmail: async (email: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.users;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.equal("email", email), Query.limit(1)],
      );
      return response.documents[0] || null;
    } catch (error) {
      logger.error("Failed to get user by email", { error, email });
      return null;
    }
  },

  create: async (data: UserCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("users", createData);
  },

  update: async (id: string, data: UserUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("users", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("users", id);
  },
};

