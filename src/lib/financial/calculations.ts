interface FinanceRecord {
  _id: string;
  record_type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  payment_method?: string;
  receipt_number?: string;
  receipt_file_id?: string;
  related_to?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  approved_by?: string;
  _creationTime: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  pendingIncome: number;
  pendingExpense: number;
  totalRecords: number;
  approvedRecords: number;
}

/**
 * Calculate financial statistics from records
 * Optimized to use a single pass over the array instead of multiple filter/reduce operations
 */
export function calculateFinancialStats(records: FinanceRecord[], total: number): FinancialStats {
  let totalIncome = 0;
  let totalExpense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;
  let approvedRecords = 0;

  // Single pass over the array for better performance
  for (const record of records) {
    const { record_type, status, amount } = record;

    if (status === 'approved') {
      approvedRecords++;
      if (record_type === 'income') {
        totalIncome += amount;
      } else if (record_type === 'expense') {
        totalExpense += amount;
      }
    } else if (status === 'pending') {
      if (record_type === 'income') {
        pendingIncome += amount;
      } else if (record_type === 'expense') {
        pendingExpense += amount;
      }
    }
  }

  return {
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    pendingIncome,
    pendingExpense,
    totalRecords: total,
    approvedRecords,
  };
}

/**
 * Validate date range for custom date filter
 */
export function validateDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) {
    return '';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return 'Başlangıç tarihi bitiş tarihinden sonra olamaz';
  }

  return '';
}

/**
 * Check if a record matches date filter
 */
export function matchesDateFilter(
  recordDate: string,
  dateFilter: string,
  customStartDate: string,
  customEndDate: string
): boolean {
  const recordDateObj = new Date(recordDate);
  const now = new Date();

  if (dateFilter === 'today') {
    return (
      recordDateObj.getDate() === now.getDate() &&
      recordDateObj.getMonth() === now.getMonth() &&
      recordDateObj.getFullYear() === now.getFullYear()
    );
  }

  if (dateFilter === 'thisMonth') {
    return (
      recordDateObj.getMonth() === now.getMonth() && recordDateObj.getFullYear() === now.getFullYear()
    );
  }

  if (dateFilter === 'custom' && customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);

    if (start > end) {
      return false;
    }

    const startDateObj = new Date(`${customStartDate}T00:00:00`);
    const endDateObj = new Date(`${customEndDate}T23:59:59`);

    return recordDateObj >= startDateObj && recordDateObj <= endDateObj;
  }

  return dateFilter === 'all' || dateFilter === '';
}

/**
 * Format currency amount (re-export from utils/format for backward compatibility)
 */
export { formatCurrency } from '@/lib/utils/format';

/**
 * Format transaction date
 */
export function formatTransactionDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export type { FinanceRecord };
