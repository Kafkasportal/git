/**
 * Scholarships API Module
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
 * Scholarships API
 */
export const appwriteScholarships = {
  list: async (
    params?: AppwriteQueryParams & { category?: string; isActive?: boolean },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarships;
    const queries = buildQueries(params);

    if (params?.category) {
      queries.push(Query.equal("category", params.category));
    }
    if (params?.isActive !== undefined) {
      queries.push(Query.equal("is_active", params.isActive));
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
      logger.error("Failed to list scholarships", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("scholarships", id);
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("scholarships", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("scholarships", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("scholarships", id);
  },

  getStatistics: async (scholarshipId?: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarshipApplications;
    const queries: string[] = [];

    if (scholarshipId) {
      queries.push(Query.equal("scholarship_id", scholarshipId));
    }

    try {
      const [all, approved, pending, rejected] = await Promise.all([
        databases.listDocuments(
          appwriteConfig.databaseId,
          collectionId,
          queries,
        ),
        databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          ...queries,
          Query.equal("status", "approved"),
        ]),
        databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          ...queries,
          Query.equal("status", "pending"),
        ]),
        databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          ...queries,
          Query.equal("status", "rejected"),
        ]),
      ]);

      return {
        total_applications: all.total,
        approved: approved.total,
        pending: pending.total,
        rejected: rejected.total,
      };
    } catch (error) {
      logger.error("Failed to get scholarship statistics", { error });
      throw error;
    }
  },
};

/**
 * Scholarship Applications API
 */
export const appwriteScholarshipApplications = {
  list: async (
    params?: AppwriteQueryParams & {
      scholarship_id?: string;
      status?: string;
      tc_no?: string;
    },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarshipApplications;
    const queries = buildQueries(params);

    if (params?.scholarship_id) {
      queries.push(Query.equal("scholarship_id", params.scholarship_id));
    }
    if (params?.status) {
      queries.push(Query.equal("status", params.status));
    }
    if (params?.tc_no) {
      queries.push(Query.equal("applicant_tc_no", params.tc_no));
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
      logger.error("Failed to list scholarship applications", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("scholarshipApplications", id);
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      status: data.status || "draft",
      createdAt: new Date().toISOString(),
    };
    return await createDocument("scholarshipApplications", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("scholarshipApplications", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("scholarshipApplications", id);
  },

  submit: async (id: string) => {
    const updateData: Record<string, unknown> = {
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("scholarshipApplications", id, updateData);
  },
};

/**
 * Scholarship Payments API
 */
export const appwriteScholarshipPayments = {
  list: async (
    params?: AppwriteQueryParams & { application_id?: string; status?: string },
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarshipPayments;
    const queries = buildQueries(params);

    if (params?.application_id) {
      queries.push(Query.equal("application_id", params.application_id));
    }
    if (params?.status) {
      queries.push(Query.equal("status", params.status));
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
      logger.error("Failed to list scholarship payments", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("scholarshipPayments", id);
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      status: data.status || "pending",
      createdAt: new Date().toISOString(),
    };
    return await createDocument("scholarshipPayments", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("scholarshipPayments", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("scholarshipPayments", id);
  },
};

