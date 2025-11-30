// Mali Yönetim Modülü TypeScript Tipleri
import { z } from 'zod';

// Transaction Types
export const TransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export const TransactionCategory = {
  // Income Categories
  DONATION: 'donation',
  MEMBERSHIP_FEE: 'membership_fee',
  SPONSORSHIP: 'sponsorship',
  EVENT_REVENUE: 'event_revenue',
  GRANT: 'grant',
  OTHER_INCOME: 'other_income',

  // Expense Categories
  ADMINISTRATIVE: 'administrative',
  PROGRAM_EXPENSES: 'program_expenses',
  SCHOLARSHIP: 'scholarship',
  ASSISTANCE: 'assistance',
  MARKETING: 'marketing',
  OFFICE_SUPPLIES: 'office_supplies',
  UTILITIES: 'utilities',
  TRANSPORTATION: 'transportation',
  OTHER_EXPENSE: 'other_expense',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
export type TransactionCategory = (typeof TransactionCategory)[keyof typeof TransactionCategory];

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  tags?: string[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Budget Types
export const BudgetPeriod = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];

export interface Budget {
  id: string;
  userId: string;
  name: string;
  period: BudgetPeriod;
  year: number;
  month?: number; // For monthly budgets
  categories: {
    [key in TransactionCategory]?: {
      planned: number;
      actual?: number;
      notes?: string;
    };
  };
  totalPlanned: number;
  totalActual: number;
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Financial Report Types
export const ReportType = {
  CASH_FLOW: 'cash_flow',
  BUDGET_COMPARISON: 'budget_comparison',
  CATEGORY_ANALYSIS: 'category_analysis',
  MONTHLY_SUMMARY: 'monthly_summary',
  YEARLY_SUMMARY: 'yearly_summary',
  DONOR_REPORT: 'donor_report',
  EXPENSE_REPORT: 'expense_report',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export interface FinancialReport {
  id: string;
  userId: string;
  type: ReportType;
  title: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  data: {
    summary: {
      totalIncome: number;
      totalExpense: number;
      netBalance: number;
      transactionCount: number;
    };
    categories: {
      [key in TransactionCategory]?: {
        income: number;
        expense: number;
        count: number;
      };
    };
    trends: {
      monthlyData: {
        month: string;
        income: number;
        expense: number;
        balance: number;
      }[];
    };
    charts: {
      pieChartData: {
        category: string;
        amount: number;
        percentage: number;
      }[];
      lineChartData: {
        date: string;
        balance: number;
        income: number;
        expense: number;
      }[];
    };
  };
  generatedAt: Date;
  createdAt: Date;
}

// Invoice Types
export const InvoiceStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Metrics
export interface DashboardMetrics {
  currentMonth: {
    income: number;
    expense: number;
    balance: number;
    transactionCount: number;
    budgetUtilization: number;
  };
  previousMonth: {
    income: number;
    expense: number;
    balance: number;
    transactionCount: number;
    budgetUtilization: number;
  };
  yearly: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    budgetVariance: number;
  };
  trends: {
    incomeTrend: 'up' | 'down' | 'stable';
    expenseTrend: 'up' | 'down' | 'stable';
    balanceTrend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  alerts: {
    budgetOverspend: boolean;
    lowBalance: boolean;
    pendingInvoices: number;
    overdueInvoices: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Query Parameters
export interface TransactionQuery {
  type?: TransactionType;
  category?: TransactionCategory;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface BudgetQuery {
  period?: BudgetPeriod;
  year?: number;
  month?: number;
  status?: string;
}

export interface ReportQuery {
  type?: ReportType;
  startDate?: string;
  endDate?: string;
}

// Zod Schemas for validation
export const TransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

export const BudgetSchema = z.object({
  name: z.string().min(1),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  year: z.number().min(2020).max(2100),
  month: z.number().min(1).max(12).optional(),
  categories: z.record(
    z.string(),
    z.object({
      planned: z.number().min(0),
      actual: z.number().min(0).optional(),
      notes: z.string().optional(),
    })
  ),
  status: z.enum(['draft', 'active', 'completed']).default('draft'),
});

export const InvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientAddress: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      total: z.number().positive(),
    })
  ),
  issueDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  notes: z.string().optional(),
});

// Utility Types
export type CreateTransactionInput = z.infer<typeof TransactionSchema>;
export type CreateBudgetInput = z.infer<typeof BudgetSchema>;
export type CreateInvoiceInput = z.infer<typeof InvoiceSchema>;
