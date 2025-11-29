
import { describe, it, expect, vi, afterEach } from 'vitest';
import { matchesDateFilter } from '@/lib/financial/calculations';

describe('matchesDateFilter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should correctly match "today" filter using local time components', () => {
    // Set "now" to a specific date
    const mockDate = new Date('2023-10-25T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Create dates using the same local date components as mockDate
    const localYear = mockDate.getFullYear();
    const localMonth = String(mockDate.getMonth() + 1).padStart(2, '0');
    const localDay = String(mockDate.getDate()).padStart(2, '0');

    // Record from same day - using local date components
    expect(matchesDateFilter(`${localYear}-${localMonth}-${localDay}T10:00:00.000Z`, 'today', '', '')).toBe(true);

    // Record from previous day
    const yesterday = new Date(mockDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const prevYear = yesterday.getFullYear();
    const prevMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const prevDay = String(yesterday.getDate()).padStart(2, '0');
    expect(matchesDateFilter(`${prevYear}-${prevMonth}-${prevDay}T23:59:59.000Z`, 'today', '', '')).toBe(false);

    // Record from next day
    const tomorrow = new Date(mockDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextYear = tomorrow.getFullYear();
    const nextMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const nextDay = String(tomorrow.getDate()).padStart(2, '0');
    expect(matchesDateFilter(`${nextYear}-${nextMonth}-${nextDay}T00:00:01.000Z`, 'today', '', '')).toBe(false);
  });

  it('should correctly match "thisMonth" filter using local time components', () => {
    // Set "now" to a specific date
    const mockDate = new Date('2023-10-25T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Create dates using local date components
    const localYear = mockDate.getFullYear();
    const localMonth = mockDate.getMonth() + 1;

    // Record from same month
    expect(matchesDateFilter(`${localYear}-${String(localMonth).padStart(2, '0')}-01T10:00:00.000Z`, 'thisMonth', '', '')).toBe(true);

    // Record from previous month
    const prevMonthDate = new Date(mockDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    const prevDay = new Date(prevYear, prevMonth, 0).getDate(); // last day of prev month
    expect(matchesDateFilter(`${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}T23:59:59.000Z`, 'thisMonth', '', '')).toBe(false);

    // Record from next month
    const nextMonthDate = new Date(mockDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth() + 1;
    expect(matchesDateFilter(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:01.000Z`, 'thisMonth', '', '')).toBe(false);
  });
});
