/**
 * Todos API Module
 */

import { Query } from "appwrite";
import {
  type AppwriteQueryParams,
  getDatabases,
  buildQueries,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";
import { appwriteConfig } from "../config";
import type { TodoCreateInput, TodoUpdateInput } from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Todos API
 */
export const appwriteTodos = {
  list: async (params?: AppwriteQueryParams & { created_by?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.todos;
    const queries = buildQueries(params);

    if (params?.created_by) {
      queries.push(Query.equal("created_by", params.created_by));
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
      logger.error("Failed to list todos", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("todos", id);
  },

  create: async (data: TodoCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("todos", createData);
  },

  update: async (id: string, data: TodoUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("todos", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("todos", id);
  },
};

