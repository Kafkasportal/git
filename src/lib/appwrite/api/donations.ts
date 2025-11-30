/**
 * Donations API Module
 */

import { Query } from "appwrite";
import {
  type AppwriteQueryParams,
  getDatabases,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";
import { appwriteConfig } from "../config";
import type {
  DonationCreateInput,
  DonationUpdateInput,
} from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Donations API
 */
export const appwriteDonations = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("donations", params);
  },

  get: async (id: string) => {
    return await getDocument("donations", id);
  },

  getByReceiptNumber: async (receipt_number: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.donations;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.equal("receipt_number", receipt_number), Query.limit(1)],
      );
      return response.documents[0] || null;
    } catch (error) {
      logger.error("Failed to get donation by receipt number", {
        error,
        receipt_number,
      });
      return null;
    }
  },

  create: async (data: DonationCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("donations", createData);
  },

  update: async (id: string, data: DonationUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("donations", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("donations", id);
  },
};

