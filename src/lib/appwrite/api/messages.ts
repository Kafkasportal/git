/**
 * Messages API Module
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
import type { MessageCreateInput, MessageUpdateInput } from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Messages API
 */
export const appwriteMessages = {
  list: async (
    params?: AppwriteQueryParams & { sender?: string; recipient?: string },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.messages;
    const queries = buildQueries(params);

    if (params?.sender) {
      queries.push(Query.equal("sender", params.sender));
    }
    if (params?.recipient) {
      queries.push(Query.equal("recipients", params.recipient));
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
      logger.error("Failed to list messages", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("messages", id);
  },

  create: async (data: MessageCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      sent_at: new Date().toISOString(),
    };
    return await createDocument("messages", createData);
  },

  update: async (id: string, data: MessageUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("messages", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("messages", id);
  },
};

