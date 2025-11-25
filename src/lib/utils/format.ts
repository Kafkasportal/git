import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Format currency amount to Turkish locale
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date to Turkish locale
 */
export function formatDate(date: Date | string, pattern: string = 'dd MMMM yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern, { locale: tr });
}

/**
 * Format date to short format (dd/MM/yyyy)
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Format date to long format (dd MMMM yyyy)
 */
export function formatDateLong(date: Date | string): string {
  return formatDate(date, 'dd MMMM yyyy');
}
