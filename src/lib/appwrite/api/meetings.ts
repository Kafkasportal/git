/**
 * Meetings API Module
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
  MeetingCreateInput,
  MeetingUpdateInput,
  MeetingDecisionCreateInput,
  MeetingDecisionUpdateInput,
  MeetingActionItemCreateInput,
  MeetingActionItemUpdateInput,
} from "@/lib/api/types";
import logger from "@/lib/logger";

/**
 * Meetings API
 */
export const appwriteMeetings = {
  list: async (params?: AppwriteQueryParams & { organizer?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.meetings;
    const queries = buildQueries(params);

    if (params?.organizer) {
      queries.push(Query.equal("organizer", params.organizer));
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
      logger.error("Failed to list meetings", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("meetings", id);
  },

  create: async (data: MeetingCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument("meetings", createData);
  },

  update: async (id: string, data: MeetingUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("meetings", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("meetings", id);
  },
};

/**
 * Meeting Decisions API
 */
export const appwriteMeetingDecisions = {
  list: async (params?: {
    meeting_id?: string;
    owner?: string;
    status?: "acik" | "devam" | "kapatildi";
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.meetingDecisions;
    const queries: string[] = [];

    if (params?.meeting_id) {
      queries.push(Query.equal("meeting_id", params.meeting_id));
    }
    if (params?.owner) {
      queries.push(Query.equal("owner", params.owner));
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
      logger.error("Failed to list meeting decisions", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("meetingDecisions", id);
  },

  create: async (data: MeetingDecisionCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument("meetingDecisions", createData);
  },

  update: async (id: string, data: MeetingDecisionUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("meetingDecisions", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("meetingDecisions", id);
  },
};

/**
 * Meeting Action Items API
 */
export const appwriteMeetingActionItems = {
  list: async (params?: {
    meeting_id?: string;
    assigned_to?: string;
    status?: "beklemede" | "devam" | "hazir" | "iptal";
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.meetingActionItems;
    const queries: string[] = [];

    if (params?.meeting_id) {
      queries.push(Query.equal("meeting_id", params.meeting_id));
    }
    if (params?.assigned_to) {
      queries.push(Query.equal("assigned_to", params.assigned_to));
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
      logger.error("Failed to list meeting action items", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("meetingActionItems", id);
  },

  create: async (data: MeetingActionItemCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument("meetingActionItems", createData);
  },

  update: async (id: string, data: MeetingActionItemUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("meetingActionItems", id, updateData);
  },

  updateStatus: async (
    id: string,
    payload: {
      status: "beklemede" | "devam" | "hazir" | "iptal";
      changed_by: string;
      note?: string;
    },
  ) => {
    const updateData: Record<string, unknown> = {
      status: payload.status,
      changed_by: payload.changed_by,
      ...(payload.note ? { note: payload.note } : {}),
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("meetingActionItems", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("meetingActionItems", id);
  },
};

