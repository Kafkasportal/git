/**
 * Currency formatting and utilities hook
 * Extracted from KumbaraForm for reusability
 */

import { useCallback } from 'react';

export function useCurrencyFormat() {
  const getCurrencySymbol = useCallback((currency: string): string => {
    const currencySymbols: Record<string, string> = {
      TRY: '₺',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return currencySymbols[currency] || currency;
  }, []);

  const formatAmount = useCallback(
    (amount: number, currency: string): string => {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [getCurrencySymbol]
  );

  return {
    getCurrencySymbol,
    formatAmount,
  };
}
