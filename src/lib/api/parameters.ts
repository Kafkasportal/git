/**
 * Parameters API
 * Client-safe API for managing application parameters
 */

import { appwriteParameters } from '@/lib/appwrite/api';

export const parametersApi = {
  getAllParameters: async () => {
    try {
      const response = await appwriteParameters.list();
      const flattened = ((response.documents || []) as Array<{ category?: string; key?: string; value?: unknown; [key: string]: unknown }>).map((doc) => ({
        category: doc.category || '',
        key: doc.key || '',
        value: doc.value,
      }));

      return {
        success: true,
        data: flattened,
        total: flattened.length,
        error: null,
      };
    } catch (error) {
      return { success: false, data: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  getParametersByCategory: async (category?: string) => {
    if (!category) {
      return { success: false, data: [], error: 'Kategori gereklidir' };
    }

    try {
      const response = await appwriteParameters.list();
      const items = ((response.documents || []) as Array<{ category?: string; key?: string; value?: unknown; [key: string]: unknown }>)
        .filter((doc) => doc.category === category)
        .map((doc) => ({
          category: doc.category || category,
          key: doc.key || '',
          value: doc.value,
        }));

      return { success: true, data: items, error: null };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  createParameter: async (data?: {
    category?: string;
    key?: string;
    value?: unknown;
    updatedBy?: string;
  }) => {
    if (!data?.category || !data?.key) {
      return { success: false, error: 'Kategori ve anahtar gereklidir' };
    }

    try {
      await appwriteParameters.create({
        category: data.category,
        key: data.key,
        value: data.value,
        updated_by: data.updatedBy,
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  updateParameter: async (
    id: string | undefined,
    data?: { category?: string; key?: string; value?: unknown; updatedBy?: string }
  ) => {
    if (!id || !data?.category || !data?.key) {
      return { success: false, error: 'ID, kategori ve anahtar gereklidir' };
    }

    try {
      await appwriteParameters.update(id, {
        category: data.category,
        key: data.key,
        value: data.value,
        updated_by: data.updatedBy,
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  deleteParameter: async (data?: { category?: string; key?: string; updatedBy?: string }) => {
    if (!data?.category || !data?.key) {
      return { success: false, error: 'Kategori ve anahtar gereklidir' };
    }

    try {
      // Find parameter by category and key, then delete
      const response = await appwriteParameters.list();
      const param = ((response.documents || []) as Array<{ category?: string; key?: string; _id?: string; $id?: string; [key: string]: unknown }>).find(
        (doc) =>
          doc.category === data.category && doc.key === data.key
      );
      
      if (param && (param._id || param.$id)) {
        await appwriteParameters.remove((param._id || param.$id) as string);
      }
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
