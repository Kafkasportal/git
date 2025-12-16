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

type ParameterRecord = Record<string, unknown>;

/**
 * Parameters API
 */
export const appwriteParameters = {
  list: async (
    params?: AppwriteQueryParams,
  ): Promise<{ documents: ParameterRecord[]; total: number }> => {
    return await listDocuments<ParameterRecord>("parameters", params);
  },

  get: async (id: string): Promise<ParameterRecord | null> => {
    return await getDocument<ParameterRecord>("parameters", id);
  },

  create: async (data: ParameterRecord): Promise<ParameterRecord> => {
    return await createDocument<ParameterRecord>("parameters", data);
  },

  update: async (id: string, data: ParameterRecord): Promise<ParameterRecord> => {
    return await updateDocument<ParameterRecord>("parameters", id, data);
  },

  remove: async (id: string): Promise<void> => {
    return await deleteDocument("parameters", id);
  },
};
