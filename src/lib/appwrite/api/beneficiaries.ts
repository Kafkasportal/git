/**
 * Beneficiaries API Module
 */

import { Query } from "appwrite";
import {
  type AppwriteQueryParams,
  type AuthContext,
  getDatabases,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";
import { appwriteConfig } from "../config";
import type {
  BeneficiaryCreateInput,
  BeneficiaryUpdateInput,
} from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Beneficiaries API
 */
export const appwriteBeneficiaries = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("beneficiaries", params);
  },

  get: async (id: string) => {
    return await getDocument("beneficiaries", id);
  },

  getByTcNo: async (tc_no: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.beneficiaries;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.equal("tc_no", tc_no), Query.limit(1)],
      );
      return response.documents[0] || null;
    } catch (error) {
      logger.error("Failed to get beneficiary by TC no", { error, tc_no });
      return null;
    }
  },

  create: async (data: BeneficiaryCreateInput, context: AuthContext = {}) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
      ...(context.auth ? { created_by: context.auth.userId } : {}),
    };
    return await createDocument("beneficiaries", createData);
  },

  update: async (
    id: string,
    data: BeneficiaryUpdateInput,
    context: AuthContext = {},
  ) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
      ...(context.auth ? { updated_by: context.auth.userId } : {}),
    };
    return await updateDocument("beneficiaries", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("beneficiaries", id);
  },
};

