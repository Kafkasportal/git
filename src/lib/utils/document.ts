/**
 * Document Utility Functions
 * Helper functions for working with Appwrite documents
 */

import type { Document } from '@/types/database';

/**
 * Get document ID (supports $id, _id, and id fields)
 */
export function getDocumentId(doc: Document | null | undefined): string {
  if (!doc) return '';
  return doc.$id || doc._id || doc.id || '';
}

/**
 * Get document creation time
 */
export function getDocumentCreatedAt(doc: Document | null | undefined): Date | null {
  if (!doc) return null;
  if (doc.$createdAt) {
    return new Date(doc.$createdAt);
  }
  if (doc._creationTime) {
    return new Date(doc._creationTime);
  }
  return null;
}

/**
 * Get document updated time
 */
export function getDocumentUpdatedAt(doc: Document | null | undefined): Date | null {
  if (!doc) return null;
  if (doc.$updatedAt) {
    return new Date(doc.$updatedAt);
  }
  if (doc._updatedAt) {
    return new Date(doc._updatedAt);
  }
  return null;
}

/**
 * Check if document is from Appwrite
 */
export function isAppwriteDocument(doc: Document | null | undefined): boolean {
  if (!doc) return false;
  return !!doc.$id;
}

