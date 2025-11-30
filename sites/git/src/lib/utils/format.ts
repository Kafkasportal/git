import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { memoize } from './memoization';

/**
 * Format currency amount to Turkish locale
 * Memoized for performance optimization
 */
const _formatCurrency = (amount: number, currency: string = 'TRY'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatCurrency = memoize(
  _formatCurrency,
  200, // Cache up to 200 currency format results
  (amount, currency) => `${amount}-${currency}` // Custom key generator
);

/**
 * Format date to Turkish locale
 * Memoized for performance optimization
 */
const _formatDate = (date: Date | string, pattern: string = 'dd MMMM yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern, { locale: tr });
};

export const formatDate = memoize(
  _formatDate,
  300, // Cache up to 300 date format results
  (date, pattern) => {
    const dateKey = typeof date === 'string' ? date : date.toISOString();
    return `${dateKey}-${pattern}`;
  }
);

/**
 * Format date to short format (dd/MM/yyyy)
 * Memoized for performance optimization
 */
export const formatDateShort = memoize(
  (date: Date | string): string => formatDate(date, 'dd/MM/yyyy'),
  300,
  (date) => {
    const dateKey = typeof date === 'string' ? date : date.toISOString();
    return `${dateKey}-short`;
  }
);

/**
 * Format date to long format (dd MMMM yyyy)
 * Memoized for performance optimization
 */
export const formatDateLong = memoize(
  (date: Date | string): string => formatDate(date, 'dd MMMM yyyy'),
  300,
  (date) => {
    const dateKey = typeof date === 'string' ? date : date.toISOString();
    return `${dateKey}-long`;
  }
);
