
import { describe, it, expect, vi, afterEach } from 'vitest';
import { matchesDateFilter } from '@/lib/financial/calculations';

describe('matchesDateFilter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should correctly match "today" filter using local time components', () => {
    // Set "now" to 2023-10-25 12:00:00 UTC
    const mockDate = new Date('2023-10-25T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Record from same day
    expect(matchesDateFilter('2023-10-25T10:00:00.000Z', 'today', '', '')).toBe(true);

    // Record from previous day
    expect(matchesDateFilter('2023-10-24T23:59:59.000Z', 'today', '', '')).toBe(false);

    // Record from next day
    expect(matchesDateFilter('2023-10-26T00:00:01.000Z', 'today', '', '')).toBe(false);
  });

  it('should correctly match "thisMonth" filter using local time components', () => {
    // Set "now" to 2023-10-25
    const mockDate = new Date('2023-10-25T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Record from same month
    expect(matchesDateFilter('2023-10-01T10:00:00.000Z', 'thisMonth', '', '')).toBe(true);

    // Record from previous month
    expect(matchesDateFilter('2023-09-30T23:59:59.000Z', 'thisMonth', '', '')).toBe(false);

    // Record from next month
    expect(matchesDateFilter('2023-11-01T00:00:01.000Z', 'thisMonth', '', '')).toBe(false);
  });
});
