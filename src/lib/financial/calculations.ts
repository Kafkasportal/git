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
 */
export function calculateFinancialStats(records: FinanceRecord[], total: number): FinancialStats {
  const totalIncome = records
    .filter((r) => r.record_type === 'income' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter((r) => r.record_type === 'expense' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const netIncome = totalIncome - totalExpense;

  const pendingIncome = records
    .filter((r) => r.record_type === 'income' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingExpense = records
    .filter((r) => r.record_type === 'expense' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    totalIncome,
    totalExpense,
    netIncome,
    pendingIncome,
    pendingExpense,
    totalRecords: total,
    approvedRecords: records.filter((r) => r.status === 'approved').length,
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
  if (dateFilter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    return recordDate.startsWith(today);
  }

  if (dateFilter === 'thisMonth') {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return recordDate.startsWith(thisMonth);
  }

  if (dateFilter === 'custom' && customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);

    if (start > end) {
      return false;
    }

    const recordDateObj = new Date(recordDate);
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
