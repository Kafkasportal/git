'use client';

import { toast } from 'sonner';
import type { FinanceRecord } from '@/lib/financial/calculations';
import { formatTransactionDate } from '@/lib/financial/calculations';
import logger from '@/lib/logger';

/**
 * Generate CSV content from financial records
 */
function generateCSVContent(records: FinanceRecord[]): string {
  const csvContent = [
    ['Rapor Türü', 'Gelir Gider Listesi'],
    ['Tarih', new Date().toLocaleDateString('tr-TR')],
    [''],
    ['KAYIT LİSTESİ'],
    [
      'Tarih',
      'Tip',
      'Kategori',
      'Açıklama',
      'Tutar',
      'Para Birimi',
      'Ödeme Yöntemi',
      'Makbuz No',
      'Durum',
    ],
    ...records.map((record) => [
      formatTransactionDate(record.transaction_date),
      record.record_type === 'income' ? 'Gelir' : 'Gider',
      record.category,
      record.description,
      record.amount.toString(),
      record.currency,
      record.payment_method || '-',
      record.receipt_number || '-',
      record.status === 'approved'
        ? 'Onaylandı'
        : record.status === 'pending'
          ? 'Beklemede'
          : 'Reddedildi',
    ]),
  ];

  return csvContent
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains special characters
          const stringCell = String(cell);
          return stringCell.includes(',') || stringCell.includes('"')
            ? `"${stringCell.replace(/"/g, '""')}"`
            : stringCell;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string): void {
  const element = document.createElement('a');
  const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  element.href = URL.createObjectURL(file);
  element.download = `gelir-gider-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Export financial records to CSV
 */
export function useExportFinancialData() {
  const handleExport = (records: FinanceRecord[], format: 'csv' | 'xlsx' = 'csv') => {
    try {
      if (records.length === 0) {
        toast.error('Dışa aktarılacak kayıt yok');
        return;
      }

      if (format === 'csv') {
        const csvContent = generateCSVContent(records);
        downloadCSV(csvContent);
        toast.success('Veriler başarıyla dışa aktarıldı');
      } else if (format === 'xlsx') {
        // For XLSX export, use ExcelJS (secure alternative)
        // See src/lib/export/export-service.ts for exportToExcel function
        toast.info('XLSX dışa aktarma özelliği yakında eklenecektir');
      }
    } catch (error) {
      logger.error('Export failed', error as Error);
      toast.error('Dışa aktarma işlemi başarısız oldu');
    }
  };

  return { handleExport };
}

/**
 * Standalone export function (alternative to hook)
 */
export function exportFinancialDataAsCSV(records: FinanceRecord[]): void {
  try {
    if (records.length === 0) {
      toast.error('Dışa aktarılacak kayıt yok');
      return;
    }

    const csvContent = generateCSVContent(records);
    downloadCSV(csvContent);
    toast.success('Veriler başarıyla dışa aktarıldı');
  } catch (error) {
    logger.error('Export failed', error as Error);
    toast.error('Dışa aktarma işlemi başarısız oldu');
  }
}
