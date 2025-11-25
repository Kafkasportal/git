/**
 * Export Service
 * Provides unified export functionality for PDF, Excel, and CSV formats
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// Types
export interface ExportColumn<T = Record<string, unknown>> {
  header: string;
  key: keyof T;
  width?: number;
  formatter?: (value: T[keyof T]) => string;
}

export interface ExportOptions<T = Record<string, unknown>> {
  title?: string;
  subtitle?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  columns: ExportColumn<T>[];
  data: T[];
  includeDate?: boolean;
  includeFooter?: boolean;
}

export interface PDFExportOptions<T = Record<string, unknown>> extends ExportOptions<T> {
  pageFormat?: 'a4' | 'letter';
  showLogo?: boolean;
  logoUrl?: string;
}

export interface ExcelExportOptions<T = Record<string, unknown>> extends ExportOptions<T> {
  sheetName?: string;
  includeTotal?: boolean;
  totalColumns?: string[];
}

export interface CSVExportOptions<T = Record<string, unknown>> {
  filename?: string;
  columns: ExportColumn<T>[];
  data: T[];
  delimiter?: string;
}

/**
 * Export data to PDF format
 */
export async function exportToPDF<T = Record<string, unknown>>(
  options: PDFExportOptions<T>
): Promise<void> {
  const {
    title = 'Rapor',
    subtitle,
    filename = `${title}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
    orientation = 'portrait',
    pageFormat = 'a4',
    columns,
    data,
    includeDate = true,
    includeFooter = true,
  } = options;

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageFormat,
  });

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  let yPosition = 30;

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(subtitle, 14, yPosition);
    yPosition += 10;
  }

  // Add date
  if (includeDate) {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Tarih: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, yPosition);
    yPosition += 10;
  }

  // Prepare table data
  const headers = columns.map((col) => col.header);
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      return col.formatter ? col.formatter(value) : String(value ?? '');
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columns.reduce<Record<number, { cellWidth: number }>>((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {}),
  });

  // Add footer
  if (includeFooter) {
    const pageCount = (
      doc as typeof doc & { internal: { getNumberOfPages: () => number } }
    ).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Sayfa ${i} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  }

  // Save the PDF
  doc.save(filename);
}

/**
 * Export data to Excel format using exceljs (secure alternative to xlsx)
 */
export async function exportToExcel<T = Record<string, unknown>>(
  options: ExcelExportOptions<T>
): Promise<void> {
  const {
    title = 'Rapor',
    filename = `${title}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`,
    sheetName = 'Sayfa1',
    columns,
    data,
    includeTotal = false,
    totalColumns = [],
  } = options;

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Prepare headers
  const headers = columns.map((col) => col.header);
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.key];
      return col.formatter ? col.formatter(value) : (value ?? '');
    });
    worksheet.addRow(rowData);
  });

  // Add totals if requested
  if (includeTotal && totalColumns.length > 0) {
    const totalRow = columns.map((col) => {
      const colKeyStr = String(col.key);
      if (totalColumns.includes(colKeyStr)) {
        const sum = data.reduce((acc, row) => {
          const value = row[col.key];
          const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
          return acc + numValue;
        }, 0);
        return col.formatter ? col.formatter(sum as T[keyof T]) : sum;
      }
      return col.key === columns[0].key ? 'TOPLAM' : '';
    });
    const totalRowIndex = worksheet.addRow(totalRow);

    // Style total row
    const totalRowObj = worksheet.getRow(totalRowIndex.number);
    totalRowObj.font = { bold: true };
    totalRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' },
    };
  }

  // Set column widths
  columns.forEach((col, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = col.width ? col.width / 5 : 15; // Convert mm to characters (approximate)
  });

  // Generate Excel file buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Create blob and trigger download
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to CSV format
 */
export async function exportToCSV<T = Record<string, unknown>>(
  options: CSVExportOptions<T>
): Promise<void> {
  const {
    filename = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`,
    columns,
    data,
    delimiter = ',',
  } = options;

  // Prepare headers
  const headers = columns.map((col) => col.header).join(delimiter);

  // Prepare data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
        // Escape delimiter and quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(delimiter)
  );

  // Combine into CSV string
  const csvContent = [headers, ...rows].join('\n');

  // Create blob and trigger download
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format currency for Turkish Lira
 * @deprecated Use formatCurrency from @/lib/utils/format instead
 */
export { formatCurrency } from '@/lib/utils/format';

/**
 * Format date for Turkish locale
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}

/**
 * Format datetime for Turkish locale
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm');
}

/**
 * Mask TC Kimlik No (show only last 4 digits)
 */
export function maskTCNo(tcNo: string): string {
  if (!tcNo || tcNo.length !== 11) return tcNo;
  return `*******${tcNo.slice(-4)}`;
}

/**
 * Export type enum
 */
export enum ExportType {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

/**
 * Main export function that handles all formats
 */
export async function exportData<T = Record<string, unknown>>(
  type: ExportType,
  options: PDFExportOptions<T> | ExcelExportOptions<T> | CSVExportOptions<T>
): Promise<void> {
  switch (type) {
    case ExportType.PDF:
      return exportToPDF(options as PDFExportOptions<T>);
    case ExportType.EXCEL:
      return exportToExcel(options as ExcelExportOptions<T>);
    case ExportType.CSV:
      return exportToCSV(options as CSVExportOptions<T>);
    default:
      throw new Error(`Unsupported export type: ${type}`);
  }
}
