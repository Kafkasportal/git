/**
 * Parameters API Module
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
 * Parameters API
 */
export const appwriteParameters = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments("parameters", params);
  },

  get: async (id: string) => {
    return await getDocument("parameters", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument("parameters", data);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument("parameters", id, data);
  },

  remove: async (id: string) => {
    return await deleteDocument("parameters", id);
  },
};

