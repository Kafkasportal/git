import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDateRangeFromPreset, getComparisonRange, type TimeRange, type DateRange } from '@/components/analytics/time-range-utils';
import { subDays, startOfYear } from 'date-fns';

describe('time-range-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDateRangeFromPreset', () => {
    it('should return 7 days range', () => {
      const result = getDateRangeFromPreset('7d');
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const expectedFrom = subDays(now, 7);

      expect(result.to.getHours()).toBe(23);
      expect(result.to.getMinutes()).toBe(59);
      expect(result.to.getSeconds()).toBe(59);
      expect(result.from.getTime()).toBe(expectedFrom.getTime());
    });

    it('should return 30 days range', () => {
      const result = getDateRangeFromPreset('30d');
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const expectedFrom = subDays(now, 30);

      expect(result.to.getHours()).toBe(23);
      expect(result.to.getMinutes()).toBe(59);
      expect(result.to.getSeconds()).toBe(59);
      expect(result.from.getTime()).toBe(expectedFrom.getTime());
    });

    it('should return year to date range', () => {
      const result = getDateRangeFromPreset('ytd');
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const expectedFrom = startOfYear(now);

      expect(result.to.getHours()).toBe(23);
      expect(result.to.getMinutes()).toBe(59);
      expect(result.to.getSeconds()).toBe(59);
      expect(result.from.getTime()).toBe(expectedFrom.getTime());
    });

    it('should default to 30 days for unknown range', () => {
      const result = getDateRangeFromPreset('custom' as TimeRange);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const expectedFrom = subDays(now, 30);

      expect(result.to.getHours()).toBe(23);
      expect(result.to.getMinutes()).toBe(59);
      expect(result.to.getSeconds()).toBe(59);
      expect(result.from.getTime()).toBe(expectedFrom.getTime());
    });
  });

  describe('getComparisonRange', () => {
    it('should calculate comparison range correctly', () => {
      const range: DateRange = {
        from: new Date('2024-06-01'),
        to: new Date('2024-06-15'),
      };

      const result = getComparisonRange(range);
      const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));

      expect(result.from.getTime()).toBe(subDays(range.from, daysDiff).getTime());
      expect(result.to.getTime()).toBe(subDays(range.from, 1).getTime());
    });
  });
});

