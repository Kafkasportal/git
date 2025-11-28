'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateFinancialStats } from '@/lib/financial/calculations';
import { useFinancialData } from '@/hooks/useFinancialData';
import { FinancialHeader } from './_components/FinancialHeader';
import { FinancialMetrics } from './_components/FinancialMetrics';
import { FinancialFilters } from './_components/FinancialFilters';
import { TransactionList } from './_components/TransactionList';
import { EditTransactionDialog } from './_components/EditTransactionDialog';
import { DeleteTransactionDialog } from './_components/DeleteTransactionDialog';
import { exportFinancialDataAsCSV } from './_components/ExportButton';
import { exportToPDF } from '@/lib/utils/pdf-export';
import { exportToExcel } from '@/lib/utils/excel-export';
import { DemoBanner } from '@/components/ui/demo-banner';
import { toast } from 'sonner';
import type { FinanceRecord } from '@/lib/financial/calculations';

export default function IncomeExpensePage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [_isViewDialogOpen, _setIsViewDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch data with filters
  const { data: recordsData, isLoading } = useFinancialData({
    page,
    limit: 50,
    search,
    recordTypeFilter,
    categoryFilter,
    statusFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  });

  const records = recordsData?.data || [];
  const total = recordsData?.total || 0;

  // Calculate financial statistics
  const stats = useMemo(() => {
    return calculateFinancialStats(records, total);
  }, [records, total]);

  const handleExportCSV = () => {
    exportFinancialDataAsCSV(records);
  };

  const handleExportExcel = () => {
    void exportToExcel(records);
  };

  const handleExportPDF = () => {
    exportToPDF(records);
  };

  const handleViewRecord = (record: FinanceRecord) => {
    setSelectedRecord(record);
    _setIsViewDialogOpen(true);
  };

  const handleEditRecord = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRecord = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data: Partial<FinanceRecord>) => {
      // TODO: Replace with actual API call when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast.success('İşlem başarıyla güncellendi');
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
    },
    onError: () => {
      toast.error('İşlem güncellenirken bir hata oluştu');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // TODO: Replace with actual API call when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast.success('İşlem başarıyla silindi');
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
    },
    onError: () => {
      toast.error('İşlem silinirken bir hata oluştu');
    },
  });

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Header Section */}
      <FinancialHeader
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onAddNew={() => {}}
        isAddDialogOpen={isAddDialogOpen}
        onAddDialogOpenChange={setIsAddDialogOpen}
      />

      {/* Metrics Cards */}
      <FinancialMetrics stats={stats} isLoading={isLoading} />

      {/* Filters Section */}
      <FinancialFilters
        search={search}
        recordTypeFilter={recordTypeFilter}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onSearchChange={setSearch}
        onRecordTypeChange={setRecordTypeFilter}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        onDateFilterChange={setDateFilter}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
        onPageChange={setPage}
      />

      {/* Transaction List */}
      <TransactionList
        records={records}
        isLoading={isLoading}
        total={total}
        onViewRecord={handleViewRecord}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Edit Transaction Dialog */}
      {selectedRecord && (
        <EditTransactionDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          record={selectedRecord}
          onSave={editMutation.mutateAsync}
          isLoading={editMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteTransactionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        record={selectedRecord}
        onConfirm={deleteMutation.mutateAsync}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
