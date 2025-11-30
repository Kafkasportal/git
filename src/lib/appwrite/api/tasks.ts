/**
 * Tasks API Module
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
import type { TaskCreateInput, TaskUpdateInput } from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Tasks API
 */
export const appwriteTasks = {
  list: async (
    params?: AppwriteQueryParams & {
      assigned_to?: string;
      created_by?: string;
    },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.tasks;
    const queries = buildQueries(params);

    if (params?.assigned_to) {
      queries.push(Query.equal("assigned_to", params.assigned_to));
    }
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
      logger.error("Failed to list tasks", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("tasks", id);
  },

  create: async (data: TaskCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("tasks", createData);
  },

  update: async (id: string, data: TaskUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("tasks", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("tasks", id);
  },
};

