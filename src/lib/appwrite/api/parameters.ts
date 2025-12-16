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

export type ParameterDocument = {
  $id?: string;
  id?: string;
  category?: string;
  key?: string;
  value?: unknown;
  [key: string]: unknown;
};

/**
 * Parameters API
 */
export const appwriteParameters = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments<ParameterDocument>("parameters", params);
  },

  get: async (id: string) => {
    return await getDocument<ParameterDocument>("parameters", id);
  },

  create: async (data: Record<string, unknown>) => {
    return await createDocument<ParameterDocument>("parameters", data);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument<ParameterDocument>("parameters", id, data);
  },

  remove: async (id: string) => {
    return await deleteDocument("parameters", id);
  },
};

