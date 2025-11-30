
import { describe, it, expect, vi, afterEach } from 'vitest';
import { matchesDateFilter, calculateFinancialStats } from '@/lib/financial/calculations';
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
