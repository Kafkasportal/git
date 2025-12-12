/**
 * Files and Storage API Module
 */

import { Query } from "appwrite";
import {
  getDatabases,
  getDocument,
  createDocument,
  deleteDocument,
} from "./base";
import { appwriteConfig } from "../config";
import { getServerStorage } from "../server";
import logger from "@/lib/logger";

/**
 * Files/Documents API
 */
export const appwriteFiles = {
  list: async (params?: {
    beneficiaryId?: string;
    bucket?: string;
    documentType?: string;
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.files;
    const queries: string[] = [];

    if (params?.beneficiaryId) {
      queries.push(Query.equal("beneficiary_id", params.beneficiaryId));
    }
    if (params?.bucket) {
      queries.push(Query.equal("bucket", params.bucket));
    }
    if (params?.documentType) {
      queries.push(Query.equal("document_type", params.documentType));
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
      logger.error("Failed to list files", { error });
      throw error;
    }
  },

  get: async (id: string) => {
    return await getDocument("files", id);
  },

  getByStorageId: async (storageId: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.files;
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.equal("storageId", storageId), Query.limit(1)],
      );
      return response.documents[0] || null;
    } catch (error) {
      logger.error("Failed to get file by storage ID", { error, storageId });
      return null;
    }
  },

  create: async (data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    bucket: string;
    storageId: string;
    beneficiaryId?: string;
    documentType?: string;
    uploadedBy?: string;
  }) => {
    const createData: Record<string, unknown> = {
      ...data,
      uploadedAt: new Date().toISOString(),
    };
    return await createDocument("files", createData);
  },

  remove: async (id: string) => {
    return await deleteDocument("files", id);
  },
};

/**
 * Storage API (Appwrite Storage)
 */
export const appwriteStorage = {
  uploadFile: async (
    bucketId: string,
    fileId: string,
    file: File | Buffer | ArrayBuffer,
    permissions?: string[],
  ) => {
    const storage = getServerStorage();
    if (!storage) {
      throw new Error("Appwrite storage is not configured");
    }

    try {
      // Dynamically import InputFile to avoid middleware issues
      const nodeAppwrite = await import("node-appwrite");
      const InputFile =
        (nodeAppwrite as any as Record<string, unknown>).InputFile ||
        (nodeAppwrite as any as Record<string, Record<string, unknown>>)
          .default?.InputFile ||
        (nodeAppwrite as any as Record<string, unknown>).InputFile;

      if (!InputFile) {
        throw new Error(
          "InputFile not found in node-appwrite. Please check the import.",
        );
      }

      const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
      // Handle Buffer properly for node-appwrite
      const buffer =
        fileBuffer instanceof Buffer
          ? fileBuffer
          : Buffer.from(fileBuffer as ArrayBuffer);
      const inputFile = (
        InputFile as {
          fromBuffer: (buffer: Buffer, filename: string) => unknown;
        }
      ).fromBuffer(buffer, "file");

      const response = await storage.createFile(
        bucketId,
        fileId,
        inputFile as File,
        permissions,
      );
      return response;
    } catch (error) {
      logger.error("Failed to upload file to Appwrite storage", {
        error,
        bucketId,
        fileId,
      });
      throw error;
    }
  },

  getFile: async (bucketId: string, fileId: string) => {
    const storage = getServerStorage();
    if (!storage) {
      throw new Error("Appwrite storage is not configured");
    }

    try {
      const response = await storage.getFile(bucketId, fileId);
      return response;
    } catch (error) {
      logger.error("Failed to get file from Appwrite storage", {
        error,
        bucketId,
        fileId,
      });
      throw error;
    }
  },

  getFileView: (bucketId: string, fileId: string): string => {
    // Generate file view URL
    const endpoint = appwriteConfig.endpoint;
    const projectId = appwriteConfig.projectId;
    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
  },

  getFileDownload: (bucketId: string, fileId: string): string => {
    // Generate file download URL
    const endpoint = appwriteConfig.endpoint;
    const projectId = appwriteConfig.projectId;
    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`;
  },

  deleteFile: async (bucketId: string, fileId: string) => {
    const storage = getServerStorage();
    if (!storage) {
      throw new Error("Appwrite storage is not configured");
    }

    try {
      await storage.deleteFile(bucketId, fileId);
      return { success: true };
    } catch (error) {
      logger.error("Failed to delete file from Appwrite storage", {
        error,
        bucketId,
        fileId,
      });
      throw error;
    }
  },
};

