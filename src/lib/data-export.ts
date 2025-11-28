/**
 * Data Export Utilities
 * Provides functions to export data in various formats (CSV, JSON, PDF)
 */

import logger from '@/lib/logger';

type DataRow = Record<string, unknown>;

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  dateFormat?: 'ISO' | 'TR';
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: DataRow[], options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    logger.warn('Export: No data to export');
    return;
  }

  const filename = options.filename || `export_${Date.now()}.csv`;

  try {
    // Get all keys from data
    const keys = Array.from(new Set(data.flatMap((row) => Object.keys(row))));

    // Create CSV header
    const header = keys.map(escapeCSV).join(',');

    // Create CSV rows
    const rows = data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          return escapeCSV(formatValue(value, options.dateFormat));
        })
        .join(',')
    );

    // Combine and add BOM for UTF-8
    const csv = `\uFEFF${[header, ...rows].join('\n')}`;

    // Download
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');

    logger.debug('CSV export successful', { filename, rowCount: data.length });
  } catch (error) {
    logger.error('CSV export failed', { error });
    throw error;
  }
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: DataRow[], options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    logger.warn('Export: No data to export');
    return;
  }

  const filename = options.filename || `export_${Date.now()}.json`;

  try {
    // Format data
    const formattedData = data.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, formatValue(value, options.dateFormat)])
      )
    );

    // Create JSON string
    const json = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        rowCount: formattedData.length,
        data: formattedData,
      },
      null,
      2
    );

    // Add BOM for UTF-8
    downloadFile(`\uFEFF${json}`, filename, 'application/json;charset=utf-8;');

    logger.debug('JSON export successful', { filename, rowCount: data.length });
  } catch (error) {
    logger.error('JSON export failed', { error });
    throw error;
  }
}

/**
 * Export data to TSV (Tab-Separated Values)
 */
export function exportToTSV(data: DataRow[], options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    logger.warn('Export: No data to export');
    return;
  }

  const filename = options.filename || `export_${Date.now()}.tsv`;

  try {
    // Get all keys from data
    const keys = Array.from(new Set(data.flatMap((row) => Object.keys(row))));

    // Create TSV header
    const header = keys.join('\t');

    // Create TSV rows
    const rows = data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          return String(formatValue(value, options.dateFormat))
            .replace(/\t/g, ' ')
            .replace(/\n/g, ' ');
        })
        .join('\t')
    );

    // Combine and add BOM for UTF-8
    const tsv = `\uFEFF${[header, ...rows].join('\n')}`;

    downloadFile(tsv, filename, 'text/tab-separated-values;charset=utf-8;');

    logger.debug('TSV export successful', { filename, rowCount: data.length });
  } catch (error) {
    logger.error('TSV export failed', { error });
    throw error;
  }
}

/**
 * Export data as PDF
 * Note: Requires html2pdf or similar library in production
 */
export async function exportToPDF(data: DataRow[], title: string, options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    logger.warn('Export: No data to export');
    return;
  }

  const filename = options.filename || `export_${Date.now()}.pdf`;

  try {
    // Create HTML table
    const keys = Array.from(new Set(data.flatMap((row) => Object.keys(row))));

    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .export-date { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="export-date">
            Dışa aktarıldı: ${new Date().toLocaleString('tr-TR')}
          </p>
          <table>
            <thead>
              <tr>
                ${keys.map((key) => `<th>${escapeHTML(String(key))}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>
                    ${keys
                      .map(
                        (key) =>
                          `<td>${escapeHTML(
                            String(formatValue(row[key], options.dateFormat))
                          )}</td>`
                      )
                      .join('')}
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Note: This is a basic HTML-to-text approach
    // For real PDF, use html2pdf or similar library
    downloadFile(html, filename.replace('.pdf', '.html'), 'text/html;charset=utf-8;');

    logger.debug('PDF export created as HTML', { filename, rowCount: data.length });
  } catch (error) {
    logger.error('PDF export failed', { error });
    throw error;
  }
}

/**
 * Export multiple sheets as Excel-like format
 */
export function exportToMultiSheet(
  sheets: Array<{
    name: string;
    data: DataRow[];
  }>,
  filename: string = `export_${Date.now()}.csv`
) {
  try {
    const content = sheets
      .map((sheet) => {
        const keys = Array.from(new Set(sheet.data.flatMap((row) => Object.keys(row))));

        const header = `# ${sheet.name}\n${keys.map(escapeCSV).join(',')}`;

        const rows = sheet.data.map((row) =>
          keys.map((key) => escapeCSV(formatValue(row[key]))).join(',')
        );

        return [header, ...rows].join('\n');
      })
      .join('\n\n');

    downloadFile(`\uFEFF${content}`, filename, 'text/csv;charset=utf-8;');

    logger.debug('Multi-sheet export successful', { filename });
  } catch (error) {
    logger.error('Multi-sheet export failed', { error });
    throw error;
  }
}

/**
 * Helper: Format value for export
 */
function formatValue(value: unknown, dateFormat: 'ISO' | 'TR' = 'ISO'): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return dateFormat === 'TR' ? value.toLocaleDateString('tr-TR') : value.toISOString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Evet' : 'Hayır';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Helper: Escape CSV values
 */
function escapeCSV(value: string): string {
  if (!value) return '';

  // Escape quotes and wrap in quotes if needed
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Helper: Escape HTML
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Helper: Download file
 */
function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Get export format from filename
 */
export function getExportFormat(filename: string): 'csv' | 'json' | 'tsv' | 'pdf' {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'json':
      return 'json';
    case 'tsv':
      return 'tsv';
    case 'pdf':
      return 'pdf';
    case 'csv':
    default:
      return 'csv';
  }
}

/**
 * Hook for data export
 */
export function useDataExport() {
  return {
    exportToCSV,
    exportToJSON,
    exportToTSV,
    exportToPDF,
    exportToMultiSheet,
  };
}
