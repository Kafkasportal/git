import { describe, it, expect } from 'vitest';
import { getDocumentId } from '@/lib/utils/document';
import type { Document } from '@/types/database';

describe('Document Utilities', () => {
  describe('getDocumentId', () => {
    it('should return null if the document is null or undefined', () => {
      expect(getDocumentId(null)).toBeNull();
      expect(getDocumentId(undefined)).toBeNull();
    });

    it('should return null for a document with no ID fields', () => {
      const doc: Document = {};
      expect(getDocumentId(doc)).toBeNull();
    });

    it('should return the ID from the "$id" field', () => {
      const doc: Document = { $id: 'appwrite_id' };
      expect(getDocumentId(doc)).toBe('appwrite_id');
    });

    it('should return the ID from the "_id" field', () => {
      const doc: Document = { _id: 'legacy_id' };
      expect(getDocumentId(doc)).toBe('legacy_id');
    });

    it('should return the ID from the "id" field', () => {
      const doc: Document = { id: 'fallback_id' };
      expect(getDocumentId(doc)).toBe('fallback_id');
    });

    it('should prioritize "$id" over other ID fields', () => {
      const doc: Document = { $id: 'appwrite_id', _id: 'legacy_id', id: 'fallback_id' };
      expect(getDocumentId(doc)).toBe('appwrite_id');
    });

    it('should prioritize "_id" over "id" when "$id" is not present', () => {
      const doc: Document = { _id: 'legacy_id', id: 'fallback_id' };
      expect(getDocumentId(doc)).toBe('legacy_id');
    });
  });
});
