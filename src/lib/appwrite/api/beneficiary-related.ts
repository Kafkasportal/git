/**
 * Beneficiary Related Collections API Module
 * Consents, Dependents, Bank Accounts
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
import logger from "@/lib/logger";

/**
 * Consents API
 */
export const appwriteConsents = {
  list: async (params?: AppwriteQueryParams & { beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.consents;
    const queries = buildQueries(params);

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
      logger.error("Failed to list consents", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("consents", id);
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("consents", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("consents", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("consents", id);
  },
};

/**
 * Dependents API
 */
export const appwriteDependents = {
  list: async (params?: AppwriteQueryParams & { beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.dependents;
    const queries = buildQueries(params);

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
      logger.error("Failed to list dependents", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("dependents", id);
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("dependents", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("dependents", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("dependents", id);
  },
};

/**
 * Bank Accounts API
 */
export const appwriteBankAccounts = {
  list: async (params?: AppwriteQueryParams & { beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.bankAccounts;
    const queries = buildQueries(params);

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
      logger.error("Failed to list bank accounts", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("bankAccounts", id);
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("bankAccounts", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("bankAccounts", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("bankAccounts", id);
  },
};

