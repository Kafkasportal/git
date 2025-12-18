import { describe, it, expect } from 'vitest';
import {
  getDocumentId,
  getDocumentCreatedAt,
  getDocumentUpdatedAt,
  isAppwriteDocument,
} from '@/lib/utils/document';

describe('document utilities', () => {
  describe('getDocumentId', () => {
    it('should return $id when present', () => {
      const doc = { $id: 'abc123', name: 'John' };
      expect(getDocumentId(doc)).toBe('abc123');
    });

    it('should return _id when $id is not present', () => {
      const doc = { _id: 'def456', name: 'Jane' };
      expect(getDocumentId(doc)).toBe('def456');
    });

    it('should return id when both $id and _id are not present', () => {
      const doc = { id: 'ghi789', name: 'Bob' };
      expect(getDocumentId(doc)).toBe('ghi789');
    });

    it('should return null when no ID field exists', () => {
      const doc = { $createdAt: '2024-01-15T10:30:00Z' };
      expect(getDocumentId(doc)).toBeNull();
    });

    it('should return null for null document', () => {
      expect(getDocumentId(null)).toBeNull();
    });

    it('should return null for undefined document', () => {
      expect(getDocumentId(undefined)).toBeNull();
    });

    it('should prioritize $id over other IDs', () => {
      const doc = { $id: 'abc123', _id: 'def456', id: 'ghi789' };
      expect(getDocumentId(doc)).toBe('abc123');
    });

    it('should prioritize _id over id when $id is missing', () => {
      const doc = { _id: 'def456', id: 'ghi789' };
      expect(getDocumentId(doc)).toBe('def456');
    });
  });

  describe('getDocumentCreatedAt', () => {
    it('should return Date from $createdAt', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const doc = { $id: 'abc123', $createdAt: dateString };
      const result = getDocumentCreatedAt(doc);
      expect(result).toEqual(new Date(dateString));
    });

    it('should return Date from _creationTime when $createdAt is missing', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const doc = { $id: 'abc123', _creationTime: timestamp };
      const result = getDocumentCreatedAt(doc);
      expect(result).toEqual(new Date(timestamp));
    });

    it('should return null when no creation date exists', () => {
      const doc = { $id: 'abc123', name: 'John' };
      expect(getDocumentCreatedAt(doc)).toBeNull();
    });

    it('should return null for null document', () => {
      expect(getDocumentCreatedAt(null)).toBeNull();
    });

    it('should return null for undefined document', () => {
      expect(getDocumentCreatedAt(undefined)).toBeNull();
    });

    it('should prioritize $createdAt over _creationTime', () => {
      const dateString1 = '2024-01-15T10:30:00Z';
      const timestamp2 = new Date('2024-01-16T10:30:00Z').getTime();
      const doc = {
        $id: 'abc123',
        $createdAt: dateString1,
        _creationTime: timestamp2,
      };
      const result = getDocumentCreatedAt(doc);
      expect(result).toEqual(new Date(dateString1));
    });

    it('should handle invalid date strings gracefully', () => {
      const doc = { $id: 'abc123', $createdAt: 'invalid-date' };
      const result = getDocumentCreatedAt(doc);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toString()).toBe('Invalid Date');
    });
  });

  describe('getDocumentUpdatedAt', () => {
    it('should return Date from $updatedAt', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const doc = { $id: 'abc123', $updatedAt: dateString };
      const result = getDocumentUpdatedAt(doc);
      expect(result).toEqual(new Date(dateString));
    });

    it('should return Date from _updatedAt when $updatedAt is missing', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const doc = { $id: 'abc123', _updatedAt: timestamp };
      const result = getDocumentUpdatedAt(doc);
      expect(result).toEqual(new Date(timestamp));
    });

    it('should return null when no update date exists', () => {
      const doc = { $id: 'abc123', name: 'John' };
      expect(getDocumentUpdatedAt(doc)).toBeNull();
    });

    it('should return null for null document', () => {
      expect(getDocumentUpdatedAt(null)).toBeNull();
    });

    it('should return null for undefined document', () => {
      expect(getDocumentUpdatedAt(undefined)).toBeNull();
    });

    it('should prioritize $updatedAt over _updatedAt', () => {
      const dateString1 = '2024-01-15T10:30:00Z';
      const timestamp2 = new Date('2024-01-16T10:30:00Z').getTime();
      const doc = {
        $id: 'abc123',
        $updatedAt: dateString1,
        _updatedAt: timestamp2,
      };
      const result = getDocumentUpdatedAt(doc);
      expect(result).toEqual(new Date(dateString1));
    });

    it('should handle invalid date strings gracefully', () => {
      const doc = { $id: 'abc123', $updatedAt: 'invalid-date' };
      const result = getDocumentUpdatedAt(doc);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toString()).toBe('Invalid Date');
    });
  });

  describe('isAppwriteDocument', () => {
    it('should return true for document with $id', () => {
      const doc = { $id: 'abc123', name: 'John' };
      expect(isAppwriteDocument(doc)).toBe(true);
    });

    it('should return false for document without $id', () => {
      const doc = { _id: 'abc123', name: 'John' };
      expect(isAppwriteDocument(doc)).toBe(false);
    });

    it('should return false for null document', () => {
      expect(isAppwriteDocument(null)).toBe(false);
    });

    it('should return false for undefined document', () => {
      expect(isAppwriteDocument(undefined)).toBe(false);
    });

    it('should return true for document with $id and other Appwrite fields', () => {
      const doc = {
        $id: 'abc123',
        $createdAt: '2024-01-15T10:30:00Z',
        $updatedAt: '2024-01-15T10:30:00Z',
        name: 'John',
      };
      expect(isAppwriteDocument(doc)).toBe(true);
    });

    it('should return false for empty object', () => {
      expect(isAppwriteDocument({})).toBe(false);
    });

    it('should return false for object with empty $id', () => {
      const doc = { $id: '', name: 'John' };
      expect(isAppwriteDocument(doc)).toBe(false);
    });
  });
});
