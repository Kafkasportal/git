
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
