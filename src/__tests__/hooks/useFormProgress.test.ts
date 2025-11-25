/**
 * Tests for useFormProgress hook
 */

import { describe, it, expect } from 'vitest';

// Helper function to calculate form progress
function calculateProgress(values: Record<string, any>, requiredFields: string[]): number {
  if (requiredFields.length === 0) return 0;

  const completedFields = requiredFields.filter((field) => {
    const value = values[field];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}

describe('useFormProgress', () => {
  describe('calculateProgress', () => {
    it('should return 0 when all fields are empty', () => {
      const requiredFields = ['field1', 'field2', 'field3'];
      const values = { field1: '', field2: '', field3: '' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(0);
    });

    it('should return 100 when all fields are filled', () => {
      const requiredFields = ['field1', 'field2', 'field3'];
      const values = { field1: 'value1', field2: 'value2', field3: 'value3' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(100);
    });

    it('should return 50 when half of the fields are filled', () => {
      const requiredFields = ['field1', 'field2'];
      const values = { field1: 'value1', field2: '' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(50);
    });

    it('should return 33 when 1 of 3 fields are filled', () => {
      const requiredFields = ['field1', 'field2', 'field3'];
      const values = { field1: 'value1', field2: '', field3: '' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(33);
    });

    it('should treat 0 as a valid filled value', () => {
      const requiredFields = ['amount', 'count'];
      const values = { amount: 0, count: 0 };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(100);
    });

    it('should treat false as a valid filled value', () => {
      const requiredFields = ['isActive', 'isVerified'];
      const values = { isActive: false, isVerified: false };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(100);
    });

    it('should treat null and undefined as empty', () => {
      const requiredFields = ['field1', 'field2', 'field3', 'field4'];
      const values = { field1: null, field2: undefined, field3: '', field4: 'value' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(25);
    });

    it('should handle empty required fields array', () => {
      const requiredFields: string[] = [];
      const values = { field1: 'value' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(0);
    });

    it('should handle missing fields in values object', () => {
      const requiredFields = ['field1', 'field2', 'field3'];
      const values = { field1: 'value1' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(33);
    });

    it('should round progress to nearest integer', () => {
      const requiredFields = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const values = { a: '1', b: '2', c: '', d: '', e: '', f: '', g: '' };
      const progress = calculateProgress(values, requiredFields);
      expect(progress).toBe(29);
    });
  });
});
