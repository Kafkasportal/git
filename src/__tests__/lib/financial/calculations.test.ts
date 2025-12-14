
import { describe, it, expect, vi, afterEach } from 'vitest';
import { matchesDateFilter, calculateFinancialStats, validateDateRange, formatTransactionDate } from '@/lib/financial/calculations';
import type { FinanceRecord } from '@/lib/financial/calculations';

describe('calculateFinancialStats', () => {
  const createRecord = (overrides: Partial<FinanceRecord>): FinanceRecord => ({
    _id: '1',
    record_type: 'income',
    category: 'Test',
    amount: 100,
    currency: 'TRY',
    description: 'Test record',
    transaction_date: '2024-01-01',
    status: 'approved',
    created_by: 'user1',
    _creationTime: '2024-01-01',
    ...overrides,
  });

  it('should calculate totals correctly for approved income records', () => {
    const records: FinanceRecord[] = [
      createRecord({ _id: '1', record_type: 'income', amount: 100, status: 'approved' }),
      createRecord({ _id: '2', record_type: 'income', amount: 200, status: 'approved' }),
    ];

    const stats = calculateFinancialStats(records, 2);

    expect(stats.totalIncome).toBe(300);
    expect(stats.totalExpense).toBe(0);
    expect(stats.netIncome).toBe(300);
    expect(stats.approvedRecords).toBe(2);
  });

  it('should calculate totals correctly for approved expense records', () => {
    const records: FinanceRecord[] = [
      createRecord({ _id: '1', record_type: 'expense', amount: 50, status: 'approved' }),
      createRecord({ _id: '2', record_type: 'expense', amount: 75, status: 'approved' }),
    ];

    const stats = calculateFinancialStats(records, 2);

    expect(stats.totalIncome).toBe(0);
    expect(stats.totalExpense).toBe(125);
    expect(stats.netIncome).toBe(-125);
    expect(stats.approvedRecords).toBe(2);
  });

  it('should calculate net income as income minus expenses', () => {
    const records: FinanceRecord[] = [
      createRecord({ _id: '1', record_type: 'income', amount: 1000, status: 'approved' }),
      createRecord({ _id: '2', record_type: 'expense', amount: 300, status: 'approved' }),
    ];

    const stats = calculateFinancialStats(records, 2);

    expect(stats.netIncome).toBe(700);
  });

  it('should calculate pending income and expense separately', () => {
    const records: FinanceRecord[] = [
      createRecord({ _id: '1', record_type: 'income', amount: 100, status: 'pending' }),
      createRecord({ _id: '2', record_type: 'expense', amount: 50, status: 'pending' }),
      createRecord({ _id: '3', record_type: 'income', amount: 200, status: 'approved' }),
    ];

    const stats = calculateFinancialStats(records, 3);

    expect(stats.pendingIncome).toBe(100);
    expect(stats.pendingExpense).toBe(50);
    expect(stats.totalIncome).toBe(200);
    expect(stats.approvedRecords).toBe(1);
  });

  it('should not count rejected records in any totals', () => {
    const records: FinanceRecord[] = [
      createRecord({ _id: '1', record_type: 'income', amount: 100, status: 'rejected' }),
      createRecord({ _id: '2', record_type: 'expense', amount: 50, status: 'rejected' }),
    ];

    const stats = calculateFinancialStats(records, 2);

    expect(stats.totalIncome).toBe(0);
    expect(stats.totalExpense).toBe(0);
    expect(stats.pendingIncome).toBe(0);
    expect(stats.pendingExpense).toBe(0);
    expect(stats.approvedRecords).toBe(0);
  });

  it('should use the provided total for totalRecords', () => {
    const records: FinanceRecord[] = [];

    const stats = calculateFinancialStats(records, 100);

    expect(stats.totalRecords).toBe(100);
  });

  it('should handle empty records array', () => {
    const stats = calculateFinancialStats([], 0);

    expect(stats.totalIncome).toBe(0);
    expect(stats.totalExpense).toBe(0);
    expect(stats.netIncome).toBe(0);
    expect(stats.pendingIncome).toBe(0);
    expect(stats.pendingExpense).toBe(0);
    expect(stats.totalRecords).toBe(0);
    expect(stats.approvedRecords).toBe(0);
  });
});

describe('matchesDateFilter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should correctly match "today" filter using local time components', () => {
    // Set "now" to a specific date (using local time to avoid timezone issues)
    const mockDate = new Date(2023, 9, 25, 12, 0, 0); // October 25, 2023 12:00 local time
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Record from same day (local time)
    const todayRecord = new Date(2023, 9, 25, 10, 0, 0).toISOString();
    expect(matchesDateFilter(todayRecord, 'today', '', '')).toBe(true);

    // Record from previous day (local time)
    const yesterdayRecord = new Date(2023, 9, 24, 23, 59, 59).toISOString();
    expect(matchesDateFilter(yesterdayRecord, 'today', '', '')).toBe(false);

    // Record from next day (local time)
    const tomorrowRecord = new Date(2023, 9, 26, 0, 0, 1).toISOString();
    expect(matchesDateFilter(tomorrowRecord, 'today', '', '')).toBe(false);
  });

  it('should correctly match "thisMonth" filter using local time components', () => {
    // Set "now" to a specific date (using local time to avoid timezone issues)
    const mockDate = new Date(2023, 9, 25, 12, 0, 0); // October 25, 2023 12:00 local time
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Record from same month (October 2023)
    const sameMonthRecord = new Date(2023, 9, 1, 10, 0, 0).toISOString();
    expect(matchesDateFilter(sameMonthRecord, 'thisMonth', '', '')).toBe(true);

    // Record from previous month (September 2023)
    const prevMonthRecord = new Date(2023, 8, 30, 23, 59, 59).toISOString();
    expect(matchesDateFilter(prevMonthRecord, 'thisMonth', '', '')).toBe(false);

    // Record from next month (November 2023)
    const nextMonthRecord = new Date(2023, 10, 1, 0, 0, 1).toISOString();
    expect(matchesDateFilter(nextMonthRecord, 'thisMonth', '', '')).toBe(false);
  });

  it('should match "all" filter for any date', () => {
    const anyRecord = new Date(2020, 0, 1).toISOString();
    expect(matchesDateFilter(anyRecord, 'all', '', '')).toBe(true);
  });

  it('should match empty filter for any date', () => {
    const anyRecord = new Date(2020, 0, 1).toISOString();
    expect(matchesDateFilter(anyRecord, '', '', '')).toBe(true);
  });

  it('should correctly match "custom" filter with valid date range', () => {
    const recordDate = '2024-06-15T12:00:00.000Z';
    const startDate = '2024-06-01';
    const endDate = '2024-06-30';

    expect(matchesDateFilter(recordDate, 'custom', startDate, endDate)).toBe(true);
  });

  it('should not match "custom" filter when record is before range', () => {
    const recordDate = '2024-05-15T12:00:00.000Z';
    const startDate = '2024-06-01';
    const endDate = '2024-06-30';

    expect(matchesDateFilter(recordDate, 'custom', startDate, endDate)).toBe(false);
  });

  it('should not match "custom" filter when record is after range', () => {
    const recordDate = '2024-07-15T12:00:00.000Z';
    const startDate = '2024-06-01';
    const endDate = '2024-06-30';

    expect(matchesDateFilter(recordDate, 'custom', startDate, endDate)).toBe(false);
  });

  it('should return false for "custom" filter when start date is after end date', () => {
    const recordDate = '2024-06-15T12:00:00.000Z';
    const startDate = '2024-06-30';
    const endDate = '2024-06-01';

    expect(matchesDateFilter(recordDate, 'custom', startDate, endDate)).toBe(false);
  });

  it('should return false for "custom" filter when missing custom dates', () => {
    const recordDate = '2024-06-15T12:00:00.000Z';

    // Missing both dates - falls through to default return which is false for 'custom'
    expect(matchesDateFilter(recordDate, 'custom', '', '')).toBe(false);
  });

  it('should match record on exact start date boundary', () => {
    // Use local time format to avoid timezone issues
    const recordDate = '2024-06-01T00:00:00';
    const startDate = '2024-06-01';
    const endDate = '2024-06-30';

    expect(matchesDateFilter(recordDate, 'custom', startDate, endDate)).toBe(true);
  });

  it('should match record on exact end date boundary', () => {
    // Use local time format to avoid timezone issues
    const recordDate = '2024-06-30T23:59:59';
    const startDate = '2024-06-01';
    const endDate = '2024-06-30';

    expect(matchesDateFilter(recordDate, 'custom', startDate, endDate)).toBe(true);
  });
});

describe('validateDateRange', () => {

  it('should return empty string for valid date range', () => {
    const result = validateDateRange('2024-01-01', '2024-12-31');
    expect(result).toBe('');
  });

  it('should return error message when start date is after end date', () => {
    const result = validateDateRange('2024-12-31', '2024-01-01');
    expect(result).toBe('Başlangıç tarihi bitiş tarihinden sonra olamaz');
  });

  it('should return empty string when start date is missing', () => {
    const result = validateDateRange('', '2024-12-31');
    expect(result).toBe('');
  });

  it('should return empty string when end date is missing', () => {
    const result = validateDateRange('2024-01-01', '');
    expect(result).toBe('');
  });

  it('should return empty string when both dates are missing', () => {
    const result = validateDateRange('', '');
    expect(result).toBe('');
  });

  it('should return empty string when dates are equal', () => {
    const result = validateDateRange('2024-06-15', '2024-06-15');
    expect(result).toBe('');
  });
});

describe('formatTransactionDate', () => {

  it('should format date in Turkish locale', () => {
    const result = formatTransactionDate('2024-06-15T12:00:00.000Z');
    // Format should be DD.MM.YYYY or similar Turkish format
    expect(result).toMatch(/\d{2}[./]\d{2}[./]\d{4}/);
  });

  it('should handle ISO date string', () => {
    const result = formatTransactionDate('2024-01-01T00:00:00.000Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
