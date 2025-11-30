/**
 * Workflow Notifications API Module
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
import type { WorkflowNotificationCreateInput } from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Workflow Notifications API
 */
export const appwriteWorkflowNotifications = {
  list: async (params?: {
    recipient?: string;
    status?: "beklemede" | "gonderildi" | "okundu";
    category?: "meeting" | "gorev" | "rapor" | "hatirlatma";
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.workflowNotifications;
    const queries: string[] = [];

    if (params?.recipient) {
      queries.push(Query.equal("recipient", params.recipient));
    }
    if (params?.status) {
      queries.push(Query.equal("status", params.status));
    }
    if (params?.category) {
      queries.push(Query.equal("category", params.category));
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
      logger.error("Failed to list workflow notifications", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("workflowNotifications", id);
  },

  create: async (data: WorkflowNotificationCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument("workflowNotifications", createData);
  },

  markAsSent: async (id: string, sent_at?: string) => {
    const updateData: Record<string, unknown> = {
      status: "gonderildi",
      sent_at: sent_at || new Date().toISOString(),
    };
    return await updateDocument("workflowNotifications", id, updateData);
  },

  markAsRead: async (id: string, read_at?: string) => {
    const updateData: Record<string, unknown> = {
      status: "okundu",
      read_at: read_at || new Date().toISOString(),
    };
    return await updateDocument("workflowNotifications", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("workflowNotifications", id);
  },
};

