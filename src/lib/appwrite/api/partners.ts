/**
 * Partners API Module
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
import type { PartnerCreateInput, PartnerUpdateInput } from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Partners API
 */
export const appwritePartners = {
  list: async (
    params?: AppwriteQueryParams & {
      type?: "organization" | "individual" | "sponsor";
      status?: "active" | "inactive" | "pending";
      partnership_type?:
        | "donor"
        | "supplier"
        | "volunteer"
        | "sponsor"
        | "service_provider";
    },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.partners;
    const queries = buildQueries(params);

    if (params?.type) {
      queries.push(Query.equal("type", params.type));
    }
    if (params?.status) {
      queries.push(Query.equal("status", params.status));
    }
    if (params?.partnership_type) {
      queries.push(Query.equal("partnership_type", params.partnership_type));
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
      logger.error("Failed to list partners", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("partners", id);
  },

  create: async (data: PartnerCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("partners", createData);
  },

  update: async (id: string, data: PartnerUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("partners", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("partners", id);
  },
};

