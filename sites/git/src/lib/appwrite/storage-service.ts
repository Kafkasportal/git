/**
 * Appwrite Storage Service
 * 
 * Enhanced storage operations with progress tracking,
 * metadata management, and permission handling
 */

import { Storage, ID } from 'appwrite';
import { client } from './client';
import { appwriteConfig, type BucketName } from './config';
import logger from '@/lib/logger';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  bucket?: BucketName;
  fileId?: string;
  permissions?: string[];
  onProgress?: (progress: UploadProgress) => void;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  bucket: string;
  storageId: string;
  beneficiaryId?: string;
  documentType?: string;
  uploadedBy?: string;
}

export class AppwriteStorageService {
  private storage: Storage | null;

  constructor() {
    this.storage = client ? new Storage(client) : null;
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.storage !== null && client !== null;
  }

  /**
   * Get bucket ID from bucket name
   */
  private getBucketId(bucket: BucketName): string {
    return appwriteConfig.buckets[bucket] || bucket;
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<{ $id: string; name: string; sizeOriginal: number; mimeType: string }> {
    if (!this.storage || !client) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucket = options.bucket || 'documents';
    const bucketId = this.getBucketId(bucket);
    const fileId = options.fileId || ID.unique();

    try {
      // Appwrite SDK doesn't support progress callback directly
      // So we'll simulate it or handle differently
      const response = await this.storage.createFile(
        bucketId,
        fileId,
        file,
        options.permissions
      );

      // Call progress callback at 100% if provided
      if (options.onProgress) {
        options.onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
      }

      return response;
    } catch (error) {
      logger.error('File upload failed', { error, bucketId, fileName: file.name });
      throw error;
    }
  }

  /**
   * Upload file and create metadata document
   */
  async uploadWithMetadata(
    file: File,
    metadata: Omit<FileMetadata, 'storageId' | 'fileName' | 'fileSize' | 'fileType' | 'bucket'>,
    options: UploadOptions = {}
  ): Promise<{ fileId: string; metadataId?: string }> {
    // Upload file
    const uploadedFile = await this.uploadFile(file, {
      ...options,
      permissions: metadata.uploadedBy
        ? [`read("user:${metadata.uploadedBy}")`, `write("user:${metadata.uploadedBy}")`]
        : options.permissions,
    });

    // Create metadata document in files collection
    try {
      const { appwriteFiles } = await import('./api');
      const metadataDoc = await appwriteFiles.create({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket: options.bucket || 'documents',
        storageId: uploadedFile.$id,
        ...metadata,
      });

      const metadataId =
        (metadataDoc as { $id?: string; id?: string }).$id ||
        (metadataDoc as { $id?: string; id?: string }).id ||
        '';

      return {
        fileId: uploadedFile.$id,
        metadataId,
      };
    } catch (metadataError) {
      logger.error('Failed to create file metadata', { error: metadataError });
      // File uploaded but metadata failed - return fileId anyway
      return { fileId: uploadedFile.$id };
    }
  }

  /**
   * Get file preview URL
   */
  getFilePreview(
    bucket: BucketName,
    fileId: string,
    width?: number,
    height?: number
  ): string {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    return this.storage.getFilePreview(bucketId, fileId, width, height);
  }

  /**
   * Get file view URL (for display)
   */
  getFileView(bucket: BucketName, fileId: string): string {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    return this.storage.getFileView(bucketId, fileId);
  }

  /**
   * Get file download URL
   */
  getFileDownload(bucket: BucketName, fileId: string): string {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    return this.storage.getFileDownload(bucketId, fileId);
  }

  /**
   * Delete file
   */
  async deleteFile(bucket: BucketName, fileId: string): Promise<void> {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    await this.storage.deleteFile(bucketId, fileId);
  }

  /**
   * List files in bucket
   */
  async listFiles(
    bucket: BucketName,
    queries?: string[]
  ): Promise<{ files: Array<{ $id: string; name: string; sizeOriginal: number }>; total: number }> {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    const response = await this.storage.listFiles(bucketId, queries);

    return {
      files: response.files,
      total: response.total,
    };
  }

  /**
   * Get file metadata
   */
  async getFile(bucket: BucketName, fileId: string) {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    return await this.storage.getFile(bucketId, fileId);
  }

  /**
   * Update file permissions
   */
  async updateFilePermissions(
    bucket: BucketName,
    fileId: string,
    permissions: string[]
  ): Promise<void> {
    if (!this.storage) {
      throw new Error('Appwrite storage not initialized');
    }

    const bucketId = this.getBucketId(bucket);
    await this.storage.updateFile(bucketId, fileId, undefined, permissions);
  }
}

// Export singleton instance
export const appwriteStorageService = new AppwriteStorageService();

