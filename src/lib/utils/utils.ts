import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export document utilities
export * from './document';

// Re-export format utilities
export { formatCurrency, formatDate, formatDateShort, formatDateLong } from './format';
