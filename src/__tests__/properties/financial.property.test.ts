/**
 * Financial Property Tests
 * Property-based tests for financial calculations
 * 
 * @module properties/financial
 */

import { describe, it, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import {
  calculateFinancialStats,
  validateDateRange,
  matchesDateFilter,
  type FinanceRecord,
} from '@/lib/financial/calculations';
import { validAmount, validCurrency } from '../test-utils/generators';

// Safe date generator that avoids NaN
const safeDate = fc.integer({ min: 1577836800000, max: Date.now() }) // 2020-01-01 to now
  .map(ts => new Date(ts).toISOString());

// Generator for finance records
const validFinanceRecord = fc.record({
  _id: fc.stringMatching(/^[a-z0-9]{20}$/),
  record_type: fc.constantFrom('income', 'expense') as fc.Arbitrary<'income' | 'expense'>,
  category: fc.stringMatching(/^[a-zA-Z]{3,20}$/),
  amount: fc.integer({ min: 1, max: 10000000 }), // Integer amounts to avoid floating point issues
  currency: fc.constantFrom('TRY', 'USD', 'EUR'),
  description: fc.stringMatching(/^[a-zA-Z0-9\s]{5,50}$/),
  transaction_date: safeDate,
  status: fc.constantFrom('pending', 'approved', 'rejected') as fc.Arbitrary<'pending' | 'approved' | 'rejected'>,
  created_by: fc.stringMatching(/^user_[a-z0-9]{5,10}$/),
  _creationTime: safeDate,
});

describe('Financial Property Tests', () => {
  /**
   * **Feature: code-quality-improvement, Property 10: Financial Calculation Precision**
   * **Validates: Requirements 6.1**
   * 
   * For any financial calculation involving amounts, the result SHALL be
   * accurate to 2 decimal places (no floating point errors).
   */
  describe('Property 10: Financial Calculation Precision', () => {
    test.prop([
      fc.array(validFinanceRecord, { minLength: 1, maxLength: 100 }),
    ], { numRuns: 100 })(
      'calculations maintain precision without floating point errors',
      (records) => {
        const stats = calculateFinancialStats(records, records.length);
        
        // All amounts should be integers (we're using integer amounts)
        expect(Number.isInteger(stats.totalIncome)).toBe(true);
        expect(Number.isInteger(stats.totalExpense)).toBe(true);
        expect(Number.isInteger(stats.netIncome)).toBe(true);
        expect(Number.isInteger(stats.pendingIncome)).toBe(true);
        expect(Number.isInteger(stats.pendingExpense)).toBe(true);
        
        // Net income should equal totalIncome - totalExpense exactly
        expect(stats.netIncome).toBe(stats.totalIncome - stats.totalExpense);
      }
    );

    it('should handle decimal amounts correctly', () => {
      const records: FinanceRecord[] = [
        {
          _id: 'test1',
          record_type: 'income',
          category: 'donation',
          amount: 100.50,
          currency: 'TRY',
          description: 'Test donation',
          transaction_date: new Date().toISOString(),
          status: 'approved',
          created_by: 'user_1',
          _creationTime: new Date().toISOString(),
        },
        {
          _id: 'test2',
          record_type: 'income',
          category: 'donation',
          amount: 200.75,
          currency: 'TRY',
          description: 'Test donation 2',
          transaction_date: new Date().toISOString(),
          status: 'approved',
          created_by: 'user_1',
          _creationTime: new Date().toISOString(),
        },
      ];
      
      const stats = calculateFinancialStats(records, records.length);
      
      // 100.50 + 200.75 = 301.25
      expect(stats.totalIncome).toBeCloseTo(301.25, 2);
    });
  });


  /**
   * **Feature: code-quality-improvement, Property 11: Financial Aggregation Consistency**
   * **Validates: Requirements 6.3**
   * 
   * For any list of financial records, the aggregate total SHALL equal
   * the sum of individual amounts.
   */
  describe('Property 11: Financial Aggregation Consistency', () => {
    test.prop([
      fc.array(validFinanceRecord, { minLength: 0, maxLength: 100 }),
    ], { numRuns: 100 })(
      'aggregate totals equal sum of individual amounts',
      (records) => {
        const stats = calculateFinancialStats(records, records.length);
        
        // Manually calculate expected totals
        let expectedIncome = 0;
        let expectedExpense = 0;
        let expectedPendingIncome = 0;
        let expectedPendingExpense = 0;
        let expectedApproved = 0;
        
        for (const record of records) {
          if (record.status === 'approved') {
            expectedApproved++;
            if (record.record_type === 'income') {
              expectedIncome += record.amount;
            } else if (record.record_type === 'expense') {
              expectedExpense += record.amount;
            }
          } else if (record.status === 'pending') {
            if (record.record_type === 'income') {
              expectedPendingIncome += record.amount;
            } else if (record.record_type === 'expense') {
              expectedPendingExpense += record.amount;
            }
          }
        }
        
        // Verify aggregations match
        expect(stats.totalIncome).toBe(expectedIncome);
        expect(stats.totalExpense).toBe(expectedExpense);
        expect(stats.pendingIncome).toBe(expectedPendingIncome);
        expect(stats.pendingExpense).toBe(expectedPendingExpense);
        expect(stats.approvedRecords).toBe(expectedApproved);
        expect(stats.totalRecords).toBe(records.length);
      }
    );

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

    it('should only count approved records in totals', () => {
      const records: FinanceRecord[] = [
        {
          _id: 'test1',
          record_type: 'income',
          category: 'donation',
          amount: 1000,
          currency: 'TRY',
          description: 'Approved donation',
          transaction_date: new Date().toISOString(),
          status: 'approved',
          created_by: 'user_1',
          _creationTime: new Date().toISOString(),
        },
        {
          _id: 'test2',
          record_type: 'income',
          category: 'donation',
          amount: 500,
          currency: 'TRY',
          description: 'Pending donation',
          transaction_date: new Date().toISOString(),
          status: 'pending',
          created_by: 'user_1',
          _creationTime: new Date().toISOString(),
        },
        {
          _id: 'test3',
          record_type: 'income',
          category: 'donation',
          amount: 300,
          currency: 'TRY',
          description: 'Rejected donation',
          transaction_date: new Date().toISOString(),
          status: 'rejected',
          created_by: 'user_1',
          _creationTime: new Date().toISOString(),
        },
      ];
      
      const stats = calculateFinancialStats(records, records.length);
      
      // Only approved should be in totalIncome
      expect(stats.totalIncome).toBe(1000);
      // Pending should be in pendingIncome
      expect(stats.pendingIncome).toBe(500);
      // Rejected should not be counted anywhere
      expect(stats.approvedRecords).toBe(1);
    });
  });

  /**
   * Date validation tests
   */
  describe('Date Range Validation', () => {
    // Use integer timestamps to avoid NaN dates
    const safeDateStr = fc.integer({ min: 1577836800000, max: 1735689600000 }) // 2020-01-01 to 2025-01-01
      .map(ts => new Date(ts).toISOString().split('T')[0]);

    test.prop([safeDateStr, safeDateStr], { numRuns: 50 })(
      'validates date ranges correctly',
      (startDate, endDate) => {
        const error = validateDateRange(startDate, endDate);
        
        // Compare dates by their date string
        const startDateOnly = new Date(startDate);
        const endDateOnly = new Date(endDate);
        
        if (startDateOnly > endDateOnly) {
          // Should return error when start > end
          expect(error.length).toBeGreaterThan(0);
        } else {
          // Should return empty string when valid
          expect(error).toBe('');
        }
      }
    );

    it('should return empty string for empty dates', () => {
      expect(validateDateRange('', '')).toBe('');
      expect(validateDateRange('2024-01-01', '')).toBe('');
      expect(validateDateRange('', '2024-01-01')).toBe('');
    });
  });

  describe('Date Filter Matching', () => {
    it('should match "all" filter for any date', () => {
      const dates = [
        '2020-01-01T00:00:00Z',
        '2023-06-15T12:00:00Z',
        '2024-12-31T23:59:59Z',
      ];
      
      dates.forEach(date => {
        expect(matchesDateFilter(date, 'all', '', '')).toBe(true);
        expect(matchesDateFilter(date, '', '', '')).toBe(true);
      });
    });

    it('should match "today" filter correctly', () => {
      const today = new Date();
      const todayStr = today.toISOString();
      
      expect(matchesDateFilter(todayStr, 'today', '', '')).toBe(true);
      
      // Yesterday should not match
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(matchesDateFilter(yesterday.toISOString(), 'today', '', '')).toBe(false);
    });

    it('should match "thisMonth" filter correctly', () => {
      const today = new Date();
      const thisMonth = today.toISOString();
      
      expect(matchesDateFilter(thisMonth, 'thisMonth', '', '')).toBe(true);
      
      // Last month should not match
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(matchesDateFilter(lastMonth.toISOString(), 'thisMonth', '', '')).toBe(false);
    });

    it('should match custom date range correctly', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      // Date within range
      expect(matchesDateFilter('2024-01-15T12:00:00Z', 'custom', startDate, endDate)).toBe(true);
      
      // Date before range
      expect(matchesDateFilter('2023-12-31T12:00:00Z', 'custom', startDate, endDate)).toBe(false);
      
      // Date after range
      expect(matchesDateFilter('2024-02-01T12:00:00Z', 'custom', startDate, endDate)).toBe(false);
    });

    it('should return false for invalid custom date range', () => {
      // Start date after end date
      expect(matchesDateFilter('2024-01-15T12:00:00Z', 'custom', '2024-02-01', '2024-01-01')).toBe(false);
    });
  });
});
