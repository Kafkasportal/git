/**
 * Finance Records API Module
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
  FinanceRecordCreateInput,
  FinanceRecordUpdateInput,
} from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Finance Records API
 */
export const appwriteFinanceRecords = {
  list: async (
    params?: AppwriteQueryParams & {
      record_type?: "income" | "expense";
      created_by?: string;
    },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.financeRecords;
    const queries = buildQueries(params);

    if (params?.record_type) {
      queries.push(Query.equal("record_type", params.record_type));
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
      logger.error("Failed to list finance records", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("financeRecords", id);
  },

  create: async (data: FinanceRecordCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("financeRecords", createData);
  },

  update: async (id: string, data: FinanceRecordUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("financeRecords", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("financeRecords", id);
  },
};

