/**
 * Export utilities for CSV and PDF formats
 * Supports Beneficiaries, Donations, Tasks, Meetings, etc.
 */

/**
 * Common type definitions
 */
type ExportData = Record<string, unknown>[];
type ColumnMapping = Record<string, string>;

/**
 * Validate data for export
 * @returns true if valid, false otherwise
 */
function validateExportData(data: ExportData): boolean {
  if (!data || data.length === 0) {
    alert('Verilecek veri yok');
    return false;
  }
  return true;
}

/**
 * Extract headers and keys from data and optional column mapping
 */
function extractHeadersAndKeys(
  data: ExportData,
  columns?: ColumnMapping
): { headers: string[]; keys: string[] } {
  const headers = columns ? Object.values(columns) : Object.keys(data[0]);
  const keys = columns ? Object.keys(columns) : Object.keys(data[0]);
  return { headers, keys };
}

/**
 * Helper function to download blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
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
 * Generate HTML table content
 */
function generateHTMLTable(
  data: ExportData,
  title: string,
  headers: string[],
  keys: string[]
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
    td { border: 1px solid #ddd; padding: 12px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    tr:hover { background-color: #ddd; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Tarih: ${new Date().toLocaleString('tr-TR')}</p>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) =>
            `<tr>${keys.map((key) => `<td>${escapeHtml(String(row[key] ?? ''))}</td>`).join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}

/**
 * Export data as CSV
 * @param data - Array of objects to export
 * @param filename - Output filename (without .csv)
 * @param columns - Optional column mapping { key: 'Display Name' }
 */
export function exportCSV(
  data: ExportData,
  filename: string = 'export',
  columns?: ColumnMapping
): void {
  if (!validateExportData(data)) return;

  const { headers, keys } = extractHeadersAndKeys(data, columns);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as JSON
 * @param data - Array of objects to export
 * @param filename - Output filename (without .json)
 */
export function exportJSON(data: ExportData, filename: string = 'export'): void {
  if (!validateExportData(data)) return;

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Export data as TSV (Tab-Separated Values)
 * Better for Excel compatibility
 * @param data - Array of objects to export
 * @param filename - Output filename (without .tsv)
 * @param columns - Optional column mapping
 */
export function exportTSV(
  data: ExportData,
  filename: string = 'export',
  columns?: ColumnMapping
): void {
  if (!validateExportData(data)) return;

  const { headers, keys } = extractHeadersAndKeys(data, columns);

  const tsvContent = [
    headers.join('\t'),
    ...data.map((row) => keys.map((key) => row[key] ?? '').join('\t')),
  ].join('\n');

  const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  downloadBlob(blob, `${filename}.tsv`);
}

/**
 * Export data as HTML table
 * @param data - Array of objects to export
 * @param filename - Output filename (without .html)
 * @param title - Table title
 * @param columns - Optional column mapping
 */
export function exportHTML(
  data: ExportData,
  filename: string = 'export',
  title: string = 'Export',
  columns?: ColumnMapping
): void {
  if (!validateExportData(data)) return;

  const { headers, keys } = extractHeadersAndKeys(data, columns);
  const htmlContent = generateHTMLTable(data, title, headers, keys);

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, `${filename}.html`);
}

/**
 * Generate PDF from HTML content using a library
 * Note: Requires pdfkit or similar library
 *
 * For now, we'll create a simple text file that can be converted to PDF
 */
export function exportPDF(
  data: ExportData,
  filename: string = 'export',
  title: string = 'Export'
): void {
  if (!validateExportData(data)) return;

  // Since we don't have pdfkit, we'll export as CSV/HTML instead
  // User can convert HTML to PDF using browser print function
  const warningMessage =
    'PDF export için HTML formatını kullanın ve tarayıcıdan "Yazdır > PDF olarak kaydet" seçeneğini kullanın.\n\nHTML formatında dışa aktarılsın mı?';

  if (window.confirm(warningMessage)) {
    exportHTML(data, filename, title);
  }
}

/**
 * Generate printer-friendly HTML and open print dialog
 */
export function printTable(
  data: ExportData,
  title: string = 'Rapor',
  columns?: ColumnMapping
): void {
  if (!validateExportData(data)) return;

  const { headers, keys } = extractHeadersAndKeys(data, columns);

  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) return;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
    td { border: 1px solid #ddd; padding: 10px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .date { color: #666; font-size: 12px; margin-top: 10px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="date">Yazdırma Tarihi: ${new Date().toLocaleString('tr-TR')}</div>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) =>
            `<tr>${keys.map((key) => `<td>${escapeHtml(String(row[key] ?? ''))}</td>`).join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
}

/**
 * Column configuration for common data types
 */
export const EXPORT_COLUMNS = {
  BENEFICIARIES: {
    firstName: 'Ad',
    lastName: 'Soyad',
    phone: 'Telefon',
    email: 'E-posta',
    city: 'Şehir',
    district: 'İlçe',
    status: 'Durum',
  },
  DONATIONS: {
    donor_name: 'Bağışçı Adı',
    donor_phone: 'Telefon',
    amount: 'Miktar',
    currency: 'Para Birimi',
    donation_date: 'Tarih',
    status: 'Durum',
  },
  TASKS: {
    title: 'Başlık',
    description: 'Açıklama',
    status: 'Durum',
    priority: 'Öncelik',
    assigned_to: 'Atanan Kişi',
    due_date: 'Son Tarih',
  },
  MEETINGS: {
    title: 'Başlık',
    meeting_date: 'Tarih',
    location: 'Konum',
    organizer: 'Organizatör',
    status: 'Durum',
    participant_count: 'Katılımcı Sayısı',
  },
} as const;
