import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PDF_STRINGS } from '@/lib/constants/pdf-strings';

// Extend jsPDF type to include autoTable
interface AutoTableOptions {
  head?: string[][];
  body?: (string | number)[][];
  startY?: number;
  margin?: { top: number; left: number; right: number };
  styles?: {
    font?: string;
    fontSize?: number;
    textColor?: number[] | number;
    fillColor?: number[];
    cellPadding?: number;
    fontStyle?: string;
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number[] | number;
    fontSize?: number;
    fontStyle?: string;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
  theme?: 'striped' | 'grid' | 'plain';
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

export interface ExportData {
  title: string;
  data: Record<string, unknown>[];
  columns: { header: string; dataKey: string }[];
  summary?: { label: string; value: string | number }[];
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  count: number;
  type: 'income' | 'expense';
  [key: string]: unknown;
}

export interface DonationReportData {
  topDonors?: Array<{
    donor: string;
    amount: number;
    count: number;
    average?: string;
  }>;
  totalDonations?: number;
  totalAmount?: number;
  averageDonation?: number;
  completedDonations?: number;
  pendingDonations?: number;
}

export interface FinancialReportData {
  categoryBreakdown?: CategoryBreakdownItem[];
  totalIncome?: number;
  totalExpense?: number;
  netIncome?: number;
}

export interface AidApplication {
  _id: string;
  applicant_name: string;
  applicant_type?: string;
  need_type?: string;
  status?: string;
  request_date?: string;
  approved_amount?: number;
  one_time_aid?: number;
  regular_financial_aid?: number;
  regular_food_aid?: number;
  in_kind_aid?: number;
  stage?: string;
  application_date?: string;
}

/**
 * Sanitizes a title string for use in filenames by:
 * 1. Normalizing to NFKD and removing diacritics (Turkish characters become ASCII)
 * 2. Converting to lowercase
 * 3. Replacing non-alphanumeric characters (except hyphen) with hyphens
 * 4. Collapsing multiple hyphens/whitespace into single hyphens
 * 5. Trimming leading/trailing hyphens
 * 6. Truncating to a safe length
 */
const sanitizeFilename = (title: string, maxLength: number = 50): string => {
  // Step 1: Normalize to NFKD and remove combining diacritical marks
  // Also handle Turkish characters that don't normalize correctly (ı, İ)
  let sanitized = title
    .replace(/[ıİ]/g, (char) => (char === 'ı' ? 'i' : 'I')) // Turkish dotless i
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove combining marks (converts é→e, ü→u, etc.)

  // Step 2: Convert to lowercase
  sanitized = sanitized.toLowerCase();

  // Step 3: Replace non-alphanumeric characters (except hyphen) and whitespace with hyphens
  // Step 4: Collapse multiple consecutive hyphens into a single hyphen
  sanitized = sanitized.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-');

  // Step 5: Trim leading and trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');

  // Step 6: Truncate to safe length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).replace(/-+$/, ''); // Remove trailing hyphen after truncation
  }

  return sanitized;
};

/**
 * Safely formats a date value, returning a fallback string if the date is invalid.
 * @param dateValue - The date value to format (can be Date, string, number, null, or undefined)
 * @param formatString - The date format string (default: 'dd.MM.yyyy')
 * @param fallback - The fallback string to return if date is invalid (default: '-')
 * @returns Formatted date string or fallback
 */
const safeFormatDate = (
  dateValue: Date | string | number | null | undefined,
  formatString: string = 'dd.MM.yyyy',
  fallback: string = '-'
): string => {
  // Return fallback if value is null or undefined
  if (dateValue === null || dateValue === undefined) {
    return fallback;
  }

  // Create Date object
  const date = new Date(dateValue);

  // Validate date: check if it's a valid date
  if (isNaN(date.getTime())) {
    return fallback;
  }

  // Format the valid date
  try {
    return format(date, formatString, { locale: tr });
  } catch (_error) {
    // If formatting fails, return fallback
    return fallback;
  }
};

export const generatePDFReport = (exportData: ExportData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(exportData.title, 20, 20);

  // Date
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(
    `${PDF_STRINGS.CREATED_DATE} ${format(new Date(), 'dd MMMM yyyy', { locale: tr })}`,
    20,
    30
  );

  // Summary section if provided
  if (exportData.summary && exportData.summary.length > 0) {
    let yPos = 45;
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(PDF_STRINGS.SUMMARY_INFO, 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(60);

    exportData.summary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 25, yPos);
      yPos += 7;
    });

    yPos += 10;
  }

  // Table
  if (exportData.data.length > 0) {
    const tableData = exportData.data.map((row) =>
      exportData.columns.map((col) => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
          return value.toLocaleString('tr-TR');
        }
        return String(value);
      })
    );

    doc.autoTable({
      head: [exportData.columns.map((col) => col.header)],
      body: tableData,
      startY: exportData.summary ? exportData.summary.length * 7 + 65 : 45,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Primary color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      margin: { top: 20, left: 20, right: 20 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${PDF_STRINGS.PAGE} ${i} / ${pageCount}`, pageWidth - 30, pageHeight - 10);
  }

  // Save the PDF
  const sanitizedTitle = sanitizeFilename(exportData.title);
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `${sanitizedTitle}-${dateStr}.pdf`;
  doc.save(fileName);
};

export const generateDonationPDF = (reportData: DonationReportData): void => {
  const exportData: ExportData = {
    title: PDF_STRINGS.DONATION_REPORTS_TITLE,
    data: reportData.topDonors || [],
    columns: [
      { header: PDF_STRINGS.DONOR, dataKey: 'donor' },
      { header: PDF_STRINGS.TOTAL_AMOUNT, dataKey: 'amount' },
      { header: PDF_STRINGS.DONATION_COUNT, dataKey: 'count' },
      { header: PDF_STRINGS.AVERAGE_AMOUNT, dataKey: 'average' },
    ],
    summary: [
      { label: PDF_STRINGS.TOTAL_DONATIONS, value: reportData.totalDonations || 0 },
      {
        label: PDF_STRINGS.TOTAL_AMOUNT_LABEL,
        value: `${(reportData.totalAmount || 0).toLocaleString('tr-TR')} ₺`,
      },
      {
        label: PDF_STRINGS.AVERAGE_DONATION,
        value: `${(reportData.averageDonation || 0).toLocaleString('tr-TR')} ₺`,
      },
      { label: PDF_STRINGS.COMPLETED, value: reportData.completedDonations || 0 },
      { label: PDF_STRINGS.PENDING, value: reportData.pendingDonations || 0 },
    ],
  };

  // Calculate average for each donor
  exportData.data = (reportData.topDonors || []).map((donor) => ({
    ...donor,
    average:
      donor.count === 0
        ? '-'
        : ((donor.amount || 0) / (donor.count || 1)).toLocaleString('tr-TR', {
            maximumFractionDigits: 0,
          }),
  })) as Record<string, unknown>[];

  generatePDFReport(exportData);
};

export const generateFinancialReportPDF = (reportData: FinancialReportData): void => {
  const exportData: ExportData = {
    title: PDF_STRINGS.FINANCIAL_REPORT_TITLE,
    data: reportData.categoryBreakdown || [],
    columns: [
      { header: PDF_STRINGS.CATEGORY, dataKey: 'category' },
      { header: PDF_STRINGS.TYPE, dataKey: 'type' },
      { header: PDF_STRINGS.AMOUNT, dataKey: 'amount' },
      { header: PDF_STRINGS.TRANSACTION_COUNT, dataKey: 'count' },
    ],
    summary: [
      {
        label: PDF_STRINGS.TOTAL_INCOME,
        value: `${(reportData.totalIncome || 0).toLocaleString('tr-TR')} ₺`,
      },
      {
        label: PDF_STRINGS.TOTAL_EXPENSE,
        value: `${(reportData.totalExpense || 0).toLocaleString('tr-TR')} ₺`,
      },
      {
        label: PDF_STRINGS.NET_INCOME,
        value: `${(reportData.netIncome || 0).toLocaleString('tr-TR')} ₺`,
      },
      {
        label: PDF_STRINGS.TOTAL_TRANSACTIONS,
        value: (reportData.categoryBreakdown || []).reduce(
          (sum: number, item: CategoryBreakdownItem) => sum + item.count,
          0
        ),
      },
    ],
  };

  // Transform data for better display
  const breakdownSource = (reportData.categoryBreakdown || []) as CategoryBreakdownItem[];
  const breakdownData = breakdownSource.map((item) => ({
    ...item,
    type: item.type === 'income' ? PDF_STRINGS.INCOME : PDF_STRINGS.EXPENSE,
    amount: item.amount.toLocaleString('tr-TR'),
  }));
  exportData.data = breakdownData as unknown as Record<string, unknown>[];

  generatePDFReport(exportData);
};

export const generateAidListPDF = (applications: AidApplication[]): void => {
  const exportData: ExportData = {
    title: PDF_STRINGS.AID_LIST_TITLE,
    data: applications.map((app) => ({
      application_id: app._id,
      applicant_name: app.applicant_name,
      applicant_type:
        app.applicant_type === 'person'
          ? PDF_STRINGS.PERSON
          : app.applicant_type === 'organization'
            ? PDF_STRINGS.ORGANIZATION
            : PDF_STRINGS.PARTNER,
      one_time_aid: app.one_time_aid || 0,
      regular_financial_aid: app.regular_financial_aid || 0,
      regular_food_aid: app.regular_food_aid || 0,
      in_kind_aid: app.in_kind_aid || 0,
      stage:
        app.stage === 'draft'
          ? PDF_STRINGS.DRAFT
          : app.stage === 'under_review'
            ? PDF_STRINGS.UNDER_REVIEW
            : app.stage === 'approved'
              ? PDF_STRINGS.APPROVED
              : app.stage === 'ongoing'
                ? PDF_STRINGS.ONGOING
                : PDF_STRINGS.COMPLETED_STAGE,
      status: app.status === 'open' ? PDF_STRINGS.OPEN : PDF_STRINGS.CLOSED,
      application_date: safeFormatDate(app.application_date, 'dd.MM.yyyy', '-'),
    })),
    columns: [
      { header: PDF_STRINGS.APPLICATION_NUMBER, dataKey: 'application_id' },
      { header: PDF_STRINGS.APPLICANT, dataKey: 'applicant_name' },
      { header: PDF_STRINGS.APPLICANT_TYPE, dataKey: 'applicant_type' },
      { header: PDF_STRINGS.ONE_TIME_AID, dataKey: 'one_time_aid' },
      { header: PDF_STRINGS.REGULAR_FINANCIAL_AID, dataKey: 'regular_financial_aid' },
      { header: PDF_STRINGS.REGULAR_FOOD_AID, dataKey: 'regular_food_aid' },
      { header: PDF_STRINGS.IN_KIND_AID, dataKey: 'in_kind_aid' },
      { header: PDF_STRINGS.STAGE, dataKey: 'stage' },
      { header: PDF_STRINGS.STATUS, dataKey: 'status' },
      { header: PDF_STRINGS.DATE, dataKey: 'application_date' },
    ],
  };

  generatePDFReport(exportData);
};
