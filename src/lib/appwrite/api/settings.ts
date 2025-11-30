/**
 * System Settings and Theme Presets API Module
 */

import { ID, Query } from "appwrite";
import {
  getDatabases,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";
import { appwriteConfig } from "../config";
import logger from "@/lib/logger";

/**
 * System Settings API
 */
export const appwriteSystemSettings = {
  getAll: async () => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [],
      );
      // Group by category
      const grouped: Record<string, Record<string, unknown>> = {};
      response.documents.forEach((doc: Record<string, unknown>) => {
        const category = doc.category as string;
        const key = doc.key as string;
        if (!grouped[category]) {
          grouped[category] = {};
        }
        grouped[category][key] = doc.value;
      });
      return grouped;
    } catch (error) {
      logger.error("Failed to get all system settings", { error });
      throw error;
    }
  },

  getByCategory: async (category: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.equal("category", category)],
      );
      const settings: Record<string, unknown> = {};
      response.documents.forEach((doc: Record<string, unknown>) => {
        settings[doc.key as string] = doc.value;
      });
      return settings;
    } catch (error) {
      logger.error("Failed to get system settings by category", {
        error,
        category,
      });
      throw error;
    }
  },

  get: async (category: string, key: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [
          Query.equal("category", category),
          Query.equal("key", key),
          Query.limit(1),
        ],
      );
      return response.documents[0]?.value || null;
    } catch (error) {
      logger.error("Failed to get system setting", { error, category, key });
      return null;
    }
  },

  getSetting: async (category: string, key: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [
          Query.equal("category", category),
          Query.equal("key", key),
          Query.limit(1),
        ],
      );
      return response.documents[0] || null;
    } catch (error) {
      logger.error("Failed to get system setting", { error, category, key });
      return null;
    }
  },

  updateSettings: async (
    category: string,
    settings: Record<string, unknown>,
    updatedBy?: string,
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    const updatedAt = new Date().toISOString();

    try {
      // Process each setting
      for (const [key, value] of Object.entries(settings)) {
        // Check if setting exists
        const existing = await databases.listDocuments(
          appwriteConfig.databaseId,
          collectionId,
          [
            Query.equal("category", category),
            Query.equal("key", key),
            Query.limit(1),
          ],
        );

        const settingData: Record<string, unknown> = {
          category,
          key,
          value,
          updated_at: updatedAt,
          ...(updatedBy ? { updated_by: updatedBy } : {}),
        };

        if (existing.documents.length > 0) {
          // Update existing
          await databases.updateDocument(
            appwriteConfig.databaseId,
            collectionId,
            existing.documents[0].$id,
            settingData,
          );
        } else {
          // Create new
          await databases.createDocument(
            appwriteConfig.databaseId,
            collectionId,
            ID.unique(),
            settingData,
          );
        }
      }
      return { success: true };
    } catch (error) {
      logger.error("Failed to update system settings", { error, category });
      throw error;
    }
  },

  updateSetting: async (
    category: string,
    key: string,
    value: unknown,
    updatedBy?: string,
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    const updatedAt = new Date().toISOString();

    try {
      // Check if setting exists
      const existing = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [
          Query.equal("category", category),
          Query.equal("key", key),
          Query.limit(1),
        ],
      );

      const settingData: Record<string, unknown> = {
        category,
        key,
        value,
        updated_at: updatedAt,
        ...(updatedBy ? { updated_by: updatedBy } : {}),
      };

      if (existing.documents.length > 0) {
        // Update existing
        await databases.updateDocument(
          appwriteConfig.databaseId,
          collectionId,
          existing.documents[0].$id,
          settingData,
        );
      } else {
        // Create new
        await databases.createDocument(
          appwriteConfig.databaseId,
          collectionId,
          ID.unique(),
          settingData,
        );
      }
      return { success: true };
    } catch (error) {
      logger.error("Failed to update system setting", { error, category, key });
      throw error;
    }
  },

  resetSettings: async (category?: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const queries: string[] = [];
      if (category) {
        queries.push(Query.equal("category", category));
      }
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries,
      );
      // Delete all matching settings
      await Promise.all(
        response.documents.map((doc) =>
          databases.deleteDocument(
            appwriteConfig.databaseId,
            collectionId,
            doc.$id,
          ),
        ),
      );
      return { success: true };
    } catch (error) {
      logger.error("Failed to reset system settings", { error, category });
      throw error;
    }
  },
};

/**
 * Theme Presets API
 */
export const appwriteThemePresets = {
  list: async () => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.themePresets;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [],
      );
      return response.documents;
    } catch (error) {
      logger.error("Failed to list theme presets", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("themePresets", id);
  },

  getDefault: async () => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.themePresets;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.equal("is_default", true), Query.limit(1)],
      );
      return response.documents[0] || null;
    } catch (error) {
      logger.error("Failed to get default theme preset", { error });
      return null;
    }
  },

  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument("themePresets", createData);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument("themePresets", id, updateData);
  },

  remove: async (id: string) => {
    return await deleteDocument("themePresets", id);
  },
};

