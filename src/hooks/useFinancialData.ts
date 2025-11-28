import { useQuery } from '@tanstack/react-query';
import { FinanceRecord, matchesDateFilter } from '@/lib/financial/calculations';

interface UseFinancialDataParams {
  page?: number;
  limit?: number;
  search?: string;
  recordTypeFilter?: string;
  categoryFilter?: string;
  statusFilter?: string;
  dateFilter?: string;
  customStartDate?: string;
  customEndDate?: string;
}

export interface FinancialDataResponse {
  data: FinanceRecord[];
  total: number;
}

/**
 * Mock data generator for financial records
 * Replace with actual API call when backend is ready
 */
function generateMockFinancialRecords(): FinanceRecord[] {
  return [
    {
      _id: '1',
      record_type: 'income',
      category: 'Bağış Gelirleri',
      amount: 50000,
      currency: 'TRY',
      description: 'Yıllık bağış kampanyası geliri',
      transaction_date: '2024-12-01T00:00:00Z',
      payment_method: 'Banka Transferi',
      receipt_number: 'RCP-2024-001',
      status: 'approved',
      created_by: 'user_1',
      approved_by: 'user_2',
      _creationTime: '2024-12-01T10:00:00Z',
    },
    {
      _id: '2',
      record_type: 'expense',
      category: 'Burs Ödemeleri',
      amount: 25000,
      currency: 'TRY',
      description: 'Aralık ayı burs ödemeleri',
      transaction_date: '2024-12-05T00:00:00Z',
      payment_method: 'Banka Transferi',
      receipt_number: 'RCP-2024-002',
      status: 'approved',
      created_by: 'user_1',
      approved_by: 'user_2',
      _creationTime: '2024-12-05T09:00:00Z',
    },
    {
      _id: '3',
      record_type: 'expense',
      category: 'Ofis Giderleri',
      amount: 3000,
      currency: 'TRY',
      description: 'Aralık ayı kiralar ve faturalar',
      transaction_date: '2024-12-10T00:00:00Z',
      payment_method: 'Otomatik Ödeme',
      receipt_number: 'RCP-2024-003',
      status: 'pending',
      created_by: 'user_1',
      _creationTime: '2024-12-10T08:00:00Z',
    },
    {
      _id: '4',
      record_type: 'income',
      category: 'Kurs Gelirleri',
      amount: 12000,
      currency: 'TRY',
      description: 'Bilgisayar kursu gelirleri',
      transaction_date: '2024-11-28T00:00:00Z',
      payment_method: 'Nakit',
      status: 'approved',
      created_by: 'user_1',
      approved_by: 'user_2',
      _creationTime: '2024-11-28T15:00:00Z',
    },
  ];
}

/**
 * Fetch and filter financial records with query parameters
 */
export function useFinancialData({
  page = 1,
  limit = 50,
  search = '',
  recordTypeFilter = 'all',
  categoryFilter = 'all',
  statusFilter = 'all',
  dateFilter = 'all',
  customStartDate = '',
  customEndDate = '',
}: UseFinancialDataParams = {}) {
  return useQuery({
    queryKey: [
      'finance-records',
      page,
      search,
      recordTypeFilter,
      categoryFilter,
      statusFilter,
      dateFilter,
      customStartDate,
      customEndDate,
    ],
    queryFn: async (): Promise<FinancialDataResponse> => {
      const mockRecords = generateMockFinancialRecords();

      const filtered = mockRecords.filter((record) => {
        // Search filter
        const matchesSearch =
          !search ||
          record.description.toLowerCase().includes(search.toLowerCase()) ||
          record.category.toLowerCase().includes(search.toLowerCase()) ||
          record.receipt_number?.toLowerCase().includes(search.toLowerCase());

        // Record type filter
        const matchesType = recordTypeFilter === 'all' || record.record_type === recordTypeFilter;

        // Category filter
        const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;

        // Status filter
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

        // Date filter
        const matchesDate = matchesDateFilter(
          record.transaction_date,
          dateFilter,
          customStartDate,
          customEndDate
        );

        return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDate;
      });

      // Return paginated results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filtered.slice(startIndex, endIndex);

      return Promise.resolve({
        data: paginatedData,
        total: filtered.length,
      });
    },
  });
}
