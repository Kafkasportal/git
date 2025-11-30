/**
 * Logs and System Events API Module
 */

import {
  type AppwriteQueryParams,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";

/**
 * Errors API
 */
export const appwriteErrors = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("errors", params);
  },

  get: async (id: string) => {
    return await getDocument("errors", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument("errors", data);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument("errors", id, data);
  },

  remove: async (id: string) => {
    return await deleteDocument("errors", id);
  },
};

/**
 * System Alerts API
 */
export const appwriteSystemAlerts = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("systemAlerts", params);
  },

  get: async (id: string) => {
    return await getDocument("systemAlerts", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument("systemAlerts", data);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument("systemAlerts", id, data);
  },

  remove: async (id: string) => {
    return await deleteDocument("systemAlerts", id);
  },
};

/**
 * Audit Logs API
 */
export const appwriteAuditLogs = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("auditLogs", params);
  },

  get: async (id: string) => {
    return await getDocument("auditLogs", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument("auditLogs", data);
  },
};

/**
 * Communication Logs API
 */
export const appwriteCommunicationLogs = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("communicationLogs", params);
  },

  get: async (id: string) => {
    return await getDocument("communicationLogs", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument("communicationLogs", data);
  },
};

/**
 * Security Events API
 */
export const appwriteSecurityEvents = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("securityEvents", params);
  },

  get: async (id: string) => {
    return await getDocument("securityEvents", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument("securityEvents", data);
  },
};

