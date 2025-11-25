/**
 * Tests for useCurrencyFormat hook
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCurrencyFormat } from '@/components/kumbara/hooks/useCurrencyFormat';

describe('useCurrencyFormat', () => {
  describe('getCurrencySymbol', () => {
    it('should return ₺ for TRY', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      expect(result.current.getCurrencySymbol('TRY')).toBe('₺');
    });

    it('should return $ for USD', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      expect(result.current.getCurrencySymbol('USD')).toBe('$');
    });

    it('should return € for EUR', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      expect(result.current.getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return £ for GBP', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      expect(result.current.getCurrencySymbol('GBP')).toBe('£');
    });

    it('should return the currency code for unknown currencies', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      expect(result.current.getCurrencySymbol('JPY')).toBe('JPY');
      expect(result.current.getCurrencySymbol('CHF')).toBe('CHF');
    });
  });

  describe('formatAmount', () => {
    it('should format TRY amount correctly', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      const formatted = result.current.formatAmount(1000, 'TRY');
      expect(formatted).toMatch(/₺1[.,]000[.,]00/); // Locale-dependent formatting
    });

    it('should format USD amount correctly', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      const formatted = result.current.formatAmount(1500.5, 'USD');
      expect(formatted).toMatch(/\$1[.,]500[.,]50/);
    });

    it('should format EUR amount correctly', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      const formatted = result.current.formatAmount(2000.75, 'EUR');
      expect(formatted).toMatch(/€2[.,]000[.,]75/);
    });

    it('should handle zero amount', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      const formatted = result.current.formatAmount(0, 'TRY');
      expect(formatted).toMatch(/₺0[.,]00/);
    });

    it('should handle decimal amounts with proper precision', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      const formatted = result.current.formatAmount(99.99, 'USD');
      expect(formatted).toMatch(/\$99[.,]99/);
    });

    it('should handle large amounts', () => {
      const { result } = renderHook(() => useCurrencyFormat());
      const formatted = result.current.formatAmount(1000000, 'TRY');
      expect(formatted).toContain('₺');
      expect(formatted).toContain('00'); // Should have decimal places
    });
  });

  describe('memoization', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useCurrencyFormat());
      const firstGetSymbol = result.current.getCurrencySymbol;
      const firstFormatAmount = result.current.formatAmount;

      rerender();

      expect(result.current.getCurrencySymbol).toBe(firstGetSymbol);
      expect(result.current.formatAmount).toBe(firstFormatAmount);
    });
  });
});
