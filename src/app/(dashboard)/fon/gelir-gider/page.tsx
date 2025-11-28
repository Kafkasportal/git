'use client';

import { useState, useMemo } from 'react';
import { calculateFinancialStats } from '@/lib/financial/calculations';
import { useFinancialData } from '@/hooks/useFinancialData';
import { FinancialHeader } from './_components/FinancialHeader';
import { FinancialMetrics } from './_components/FinancialMetrics';
import { FinancialFilters } from './_components/FinancialFilters';
import { TransactionList } from './_components/TransactionList';
import { exportFinancialDataAsCSV } from './_components/ExportButton';
import { DemoBanner } from '@/components/ui/demo-banner';
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
  const [_selectedRecord, _setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [_isViewDialogOpen, _setIsViewDialogOpen] = useState(false);

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

  const handleExportExcel = () => {
    exportFinancialDataAsCSV(records);
  };

  const handleViewRecord = (record: FinanceRecord) => {
    _setSelectedRecord(record);
    _setIsViewDialogOpen(true);
  };

  const handleEditRecord = (record: FinanceRecord) => {
    _setSelectedRecord(record);
    // Edit dialog not yet implemented
    // See docs/ISSUES.md - Issue #8: Transaction Edit Dialog
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Header Section */}
      <FinancialHeader
        onExportExcel={handleExportExcel}
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
      />
    </div>
  );
}
