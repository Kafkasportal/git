/**
 * Aid Applications API Module
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
import type {
  AidApplicationCreateInput,
  AidApplicationUpdateInput,
} from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Aid Applications API
 */
export const appwriteAidApplications = {
  list: async (
    params?: AppwriteQueryParams & { stage?: string; beneficiary_id?: string },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.aidApplications;
    const queries = buildQueries(params);

    if (params?.stage) {
      queries.push(Query.equal("stage", params.stage));
    }
    if (params?.beneficiary_id) {
      queries.push(Query.equal("beneficiary_id", params.beneficiary_id));
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
      logger.error("Failed to list aid applications", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("aidApplications", id);
  },

  create: async (data: AidApplicationCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("aidApplications", createData);
  },

  update: async (id: string, data: AidApplicationUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("aidApplications", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("aidApplications", id);
  },
};

