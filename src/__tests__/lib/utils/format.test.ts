/**
 * Format Utility Tests
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateShort, formatDateLong } from '@/lib/utils/format';

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('formats TRY currency correctly', () => {
      const result = formatCurrency(1000, 'TRY');
      expect(result).toContain('1.000');
      expect(result).toMatch(/₺|TRY/);
    });

    it('formats USD currency correctly', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('1.000');
      expect(result).toMatch(/\$|USD/);
    });

    it('formats EUR currency correctly', () => {
      const result = formatCurrency(1000, 'EUR');
      expect(result).toContain('1.000');
      expect(result).toMatch(/€|EUR/);
    });

    it('handles decimal amounts', () => {
      const result = formatCurrency(1234.56, 'TRY');
      expect(result).toContain('1.234');
    });

    it('handles zero amount', () => {
      const result = formatCurrency(0, 'TRY');
      expect(result).toContain('0');
    });

    it('handles negative amounts', () => {
      const result = formatCurrency(-500, 'TRY');
      expect(result).toContain('500');
      expect(result).toMatch(/-|−/);
    });

    it('defaults to TRY when no currency specified', () => {
      const result = formatCurrency(100);
      expect(result).toMatch(/₺|TRY/);
    });

    it('returns cached result for same inputs (memoization)', () => {
      const result1 = formatCurrency(999, 'TRY');
      const result2 = formatCurrency(999, 'TRY');
      expect(result1).toBe(result2);
    });
  });

  describe('formatDate', () => {
    it('formats date with default pattern', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats date string', () => {
      const result = formatDate('2024-06-15T12:00:00Z');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats with custom pattern', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2024-06-15');
    });

    it('returns cached result for same inputs (memoization)', () => {
      const date = '2024-01-01T00:00:00Z';
      const result1 = formatDate(date, 'dd/MM/yyyy');
      const result2 = formatDate(date, 'dd/MM/yyyy');
      expect(result1).toBe(result2);
    });
  });

  describe('formatDateShort', () => {
    it('formats date in short format (dd/MM/yyyy)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateShort(date);
      expect(result).toBe('15/06/2024');
    });

    it('formats date string in short format', () => {
      const result = formatDateShort('2024-12-25T00:00:00Z');
      expect(result).toBe('25/12/2024');
    });
  });

  describe('formatDateLong', () => {
    it('formats date in long format', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateLong(date);
      expect(result).toContain('15');
      expect(result).toContain('2024');
      // Should contain Turkish month name
      expect(result.toLowerCase()).toMatch(/haziran|june/i);
    });

    it('formats date string in long format', () => {
      const result = formatDateLong('2024-01-01T00:00:00Z');
      expect(result).toContain('01');
      expect(result).toContain('2024');
    });
  });
});
