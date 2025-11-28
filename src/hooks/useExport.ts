/**
 * useExport Hook
 * Provides easy-to-use export functionality in React components
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import {
  exportData,
  ExportType,
  type ExportColumn,
  type PDFExportOptions,
  type ExcelExportOptions,
  type CSVExportOptions,
} from '@/lib/export/export-service';

interface UseExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useExport(options: UseExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (
      type: ExportType,
      exportOptions: PDFExportOptions | ExcelExportOptions | CSVExportOptions
    ) => {
      setIsExporting(true);
      try {
        await exportData(type, exportOptions);
        toast.success(
          type === ExportType.PDF
            ? 'PDF başarıyla oluşturuldu'
            : type === ExportType.EXCEL
              ? 'Excel dosyası başarıyla oluşturuldu'
              : 'CSV dosyası başarıyla oluşturuldu'
        );
        options.onSuccess?.();
      } catch (error) {
        logger.error('Export failed', { error, type });
        toast.error('Dışa aktarma sırasında bir hata oluştu');
        options.onError?.(error as Error);
      } finally {
        setIsExporting(false);
      }
    },
    [options]
  );

  const exportPDF = useCallback(
    (exportOptions: PDFExportOptions) => {
      return handleExport(ExportType.PDF, exportOptions);
    },
    [handleExport]
  );

  const exportExcel = useCallback(
    (exportOptions: ExcelExportOptions) => {
      return handleExport(ExportType.EXCEL, exportOptions);
    },
    [handleExport]
  );

  const exportCSV = useCallback(
    (exportOptions: CSVExportOptions) => {
      return handleExport(ExportType.CSV, exportOptions);
    },
    [handleExport]
  );

  return {
    isExporting,
    exportPDF,
    exportExcel,
    exportCSV,
  };
}

// Predefined column configurations for common entities

export const beneficiaryExportColumns: ExportColumn[] = [
  { header: 'Ad Soyad', key: 'name', width: 40 },
  { header: 'TC No', key: 'tc_no', width: 30 },
  { header: 'Telefon', key: 'phone', width: 30 },
  { header: 'Şehir', key: 'city', width: 25 },
  { header: 'İlçe', key: 'district', width: 25 },
  { header: 'Durum', key: 'status', width: 20 },
];

export const donationExportColumns: ExportColumn[] = [
  { header: 'Bağışçı', key: 'donor_name', width: 40 },
  { header: 'Telefon', key: 'donor_phone', width: 30 },
  {
    header: 'Tutar',
    key: 'amount',
    width: 25,
    formatter: (value: unknown) =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(Number(value)),
  },
  { header: 'Bağış Türü', key: 'donation_type', width: 30 },
  { header: 'Durum', key: 'status', width: 20 },
];

export const financialRecordExportColumns: ExportColumn[] = [
  { header: 'Tarih', key: 'date', width: 25 },
  { header: 'Açıklama', key: 'description', width: 50 },
  { header: 'Kategori', key: 'category', width: 30 },
  {
    header: 'Gelir',
    key: 'income',
    width: 25,
    formatter: (value: unknown) =>
      value
        ? new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }).format(Number(value))
        : '-',
  },
  {
    header: 'Gider',
    key: 'expense',
    width: 25,
    formatter: (value: unknown) =>
      value
        ? new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }).format(Number(value))
        : '-',
  },
];

export const meetingExportColumns: ExportColumn[] = [
  { header: 'Başlık', key: 'title', width: 50 },
  { header: 'Tarih', key: 'date', width: 30 },
  { header: 'Süre', key: 'duration', width: 20 },
  { header: 'Katılımcı Sayısı', key: 'participantCount', width: 25 },
  { header: 'Durum', key: 'status', width: 20 },
];

export const taskExportColumns: ExportColumn[] = [
  { header: 'Başlık', key: 'title', width: 50 },
  { header: 'Açıklama', key: 'description', width: 60 },
  { header: 'Durum', key: 'status', width: 20 },
  { header: 'Öncelik', key: 'priority', width: 20 },
  { header: 'Bitiş Tarihi', key: 'dueDate', width: 30 },
];
