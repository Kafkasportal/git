/**
 * Document Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getDocumentId,
  getDocumentCreatedAt,
  getDocumentUpdatedAt,
  isAppwriteDocument,
} from '@/lib/utils/document';
import type { Document } from '@/types/database';

describe('Document Utilities', () => {
  describe('getDocumentId', () => {
    it('returns $id for Appwrite documents', () => {
      const doc: Document = { $id: 'appwrite-id-123' };
      expect(getDocumentId(doc)).toBe('appwrite-id-123');
    });

    it('returns _id for legacy documents', () => {
      const doc: Document = { _id: 'legacy-id-456' };
      expect(getDocumentId(doc)).toBe('legacy-id-456');
    });

    it('returns id as fallback', () => {
      const doc: Document = { id: 'fallback-id-789' };
      expect(getDocumentId(doc)).toBe('fallback-id-789');
    });

    it('prefers $id over _id', () => {
      const doc: Document = { $id: 'appwrite', _id: 'legacy' };
      expect(getDocumentId(doc)).toBe('appwrite');
    });

    it('returns null for null document', () => {
      expect(getDocumentId(null)).toBeNull();
    });

    it('returns null for undefined document', () => {
      expect(getDocumentId(undefined)).toBeNull();
    });

    it('returns null for document without id', () => {
      const doc: Document = {};
      expect(getDocumentId(doc)).toBeNull();
    });
  });

  describe('getDocumentCreatedAt', () => {
    it('returns Date from $createdAt', () => {
      const doc: Document = { $createdAt: '2024-01-15T10:30:00.000Z' };
      const result = getDocumentCreatedAt(doc);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('returns Date from _creationTime', () => {
      const timestamp = Date.now();
      const doc: Document = { _creationTime: timestamp };
      const result = getDocumentCreatedAt(doc);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('prefers $createdAt over _creationTime', () => {
      const doc: Document = {
        $createdAt: '2024-01-15T10:30:00.000Z',
        _creationTime: Date.now(),
      };
      const result = getDocumentCreatedAt(doc);
      expect(result?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('returns null for null document', () => {
      expect(getDocumentCreatedAt(null)).toBeNull();
    });

    it('returns null for undefined document', () => {
      expect(getDocumentCreatedAt(undefined)).toBeNull();
    });

    it('returns null for document without creation time', () => {
      const doc: Document = { $id: 'test' };
      expect(getDocumentCreatedAt(doc)).toBeNull();
    });
  });

  describe('getDocumentUpdatedAt', () => {
    it('returns Date from $updatedAt', () => {
      const doc: Document = { $updatedAt: '2024-06-20T15:45:00.000Z' };
      const result = getDocumentUpdatedAt(doc);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-06-20T15:45:00.000Z');
    });

    it('returns Date from _updatedAt', () => {
      const timestamp = Date.now();
      const doc: Document = { _updatedAt: timestamp };
      const result = getDocumentUpdatedAt(doc);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('prefers $updatedAt over _updatedAt', () => {
      const doc: Document = {
        $updatedAt: '2024-06-20T15:45:00.000Z',
        _updatedAt: Date.now(),
      };
      const result = getDocumentUpdatedAt(doc);
      expect(result?.toISOString()).toBe('2024-06-20T15:45:00.000Z');
    });

    it('returns null for null document', () => {
      expect(getDocumentUpdatedAt(null)).toBeNull();
    });

    it('returns null for undefined document', () => {
      expect(getDocumentUpdatedAt(undefined)).toBeNull();
    });

    it('returns null for document without update time', () => {
      const doc: Document = { $id: 'test' };
      expect(getDocumentUpdatedAt(doc)).toBeNull();
    });
  });

  describe('isAppwriteDocument', () => {
    it('returns true for document with $id', () => {
      const doc: Document = { $id: 'appwrite-doc' };
      expect(isAppwriteDocument(doc)).toBe(true);
    });

    it('returns false for document without $id', () => {
      const doc: Document = { _id: 'legacy-doc' };
      expect(isAppwriteDocument(doc)).toBe(false);
    });

    it('returns false for null document', () => {
      expect(isAppwriteDocument(null)).toBe(false);
    });

    it('returns false for undefined document', () => {
      expect(isAppwriteDocument(undefined)).toBe(false);
    });

    it('returns false for empty document', () => {
      const doc: Document = {};
      expect(isAppwriteDocument(doc)).toBe(false);
    });
  });
});
