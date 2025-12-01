'use client';

import { useState, useCallback } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Printer,
  Loader2,
  ChevronDown,
  FileDown,
  Table,
} from 'lucide-react';
import { exportCSV, exportJSON, exportHTML, printTable } from '@/lib/export';
import { exportToExcel, exportToPDF, ExportColumn } from '@/lib/export/export-service';
import { toast } from 'sonner';

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename: string;
  title?: string;
  columns?: Record<string, string>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
  compact?: boolean;
  includeExcel?: boolean;
  includePDF?: boolean;
}

/**
 * Enhanced export buttons with Excel and PDF support
 */
export function ExportButtons({
  data,
  filename,
  title = 'Rapor',
  columns,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  compact = true,
  includeExcel = true,
  includePDF = true,
}: ExportButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  // Convert columns to ExportColumn format
  const exportColumns: ExportColumn<Record<string, unknown>>[] = columns
    ? Object.entries(columns).map(([key, header]) => ({
        header,
        key: key as keyof Record<string, unknown>,
      }))
    : Object.keys(data[0] || {}).map((key) => ({
        header: key,
        key: key as keyof Record<string, unknown>,
      }));

  const handleExport = useCallback(
    async (format: string) => {
      if (!data || data.length === 0) {
        toast.error('Dışa aktarılacak veri yok');
        return;
      }

      setIsLoading(true);
      setLoadingFormat(format);

      try {
        switch (format) {
          case 'csv':
            exportCSV(data, filename, columns);
            toast.success('CSV dosyası indirildi');
            break;

          case 'excel':
            await exportToExcel({
              title,
              filename: `${filename}.xlsx`,
              columns: exportColumns,
              data,
              includeTotal: false,
            });
            toast.success('Excel dosyası indirildi');
            break;

          case 'pdf':
            await exportToPDF({
              title,
              filename: `${filename}.pdf`,
              columns: exportColumns,
              data,
              orientation: data.length > 50 ? 'landscape' : 'portrait',
            });
            toast.success('PDF dosyası indirildi');
            break;

          case 'json':
            exportJSON(data, filename);
            toast.success('JSON dosyası indirildi');
            break;

          case 'html':
            exportHTML(data, filename, title, columns);
            toast.success('HTML dosyası indirildi');
            break;

          case 'print':
            printTable(data, title, columns);
            break;

          default:
            throw new Error(`Desteklenmeyen format: ${format}`);
        }
      } catch (error) {
        logger.error('Export error', { error });
        toast.error(`Dışa aktarma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      } finally {
        setIsLoading(false);
        setLoadingFormat(null);
      }
    },
    [data, filename, title, columns, exportColumns]
  );

  if (!data || data.length === 0) {
    return null;
  }

  // Compact mode with dropdown
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {showLabel && 'Dışa Aktar'}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileDown className="h-3 w-3" />
            {data.length} kayıt
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Excel - Primary */}
          {includeExcel && (
            <DropdownMenuItem
              onClick={() => handleExport('excel')}
              disabled={loadingFormat === 'excel'}
              className="gap-2 cursor-pointer"
            >
              {loadingFormat === 'excel' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Table className="h-4 w-4 text-green-600" />
              )}
              <span>Excel (.xlsx)</span>
            </DropdownMenuItem>
          )}

          {/* PDF */}
          {includePDF && (
            <DropdownMenuItem
              onClick={() => handleExport('pdf')}
              disabled={loadingFormat === 'pdf'}
              className="gap-2 cursor-pointer"
            >
              {loadingFormat === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-red-600" />
              )}
              <span>PDF (.pdf)</span>
            </DropdownMenuItem>
          )}

          {/* CSV */}
          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            disabled={loadingFormat === 'csv'}
            className="gap-2 cursor-pointer"
          >
            {loadingFormat === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            )}
            <span>CSV (.csv)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* JSON */}
          <DropdownMenuItem
            onClick={() => handleExport('json')}
            disabled={loadingFormat === 'json'}
            className="gap-2 cursor-pointer text-muted-foreground"
          >
            {loadingFormat === 'json' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4" />
            )}
            <span>JSON (.json)</span>
          </DropdownMenuItem>

          {/* HTML */}
          <DropdownMenuItem
            onClick={() => handleExport('html')}
            disabled={loadingFormat === 'html'}
            className="gap-2 cursor-pointer text-muted-foreground"
          >
            {loadingFormat === 'html' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>HTML (.html)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Print */}
          <DropdownMenuItem
            onClick={() => handleExport('print')}
            className="gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Yazdır</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full buttons mode
  return (
    <div className="flex gap-2 flex-wrap">
      {includeExcel && (
        <Button
          variant={variant}
          size={size}
          onClick={() => handleExport('excel')}
          disabled={loadingFormat === 'excel'}
          className="gap-1"
        >
          {loadingFormat === 'excel' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Table className="h-4 w-4" />
          )}
          {showLabel && 'Excel'}
        </Button>
      )}

      {includePDF && (
        <Button
          variant={variant}
          size={size}
          onClick={() => handleExport('pdf')}
          disabled={loadingFormat === 'pdf'}
          className="gap-1"
        >
          {loadingFormat === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {showLabel && 'PDF'}
        </Button>
      )}

      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport('csv')}
        disabled={loadingFormat === 'csv'}
        className="gap-1"
      >
        {loadingFormat === 'csv' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {showLabel && 'CSV'}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport('print')}
        className="gap-1"
      >
        <Printer className="h-4 w-4" />
        {showLabel && 'Yazdır'}
      </Button>
    </div>
  );
}

/**
 * Simple single download button
 */
interface SimpleExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  format?: 'csv' | 'json' | 'html' | 'excel' | 'pdf';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  label?: string;
  columns?: Record<string, string>;
  title?: string;
}

export function SimpleExportButton({
  data,
  filename,
  format = 'csv',
  variant = 'outline',
  size = 'sm',
  label = 'İndir',
  columns,
  title = 'Rapor',
}: SimpleExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const exportColumns: ExportColumn<Record<string, unknown>>[] = columns
    ? Object.entries(columns).map(([key, header]) => ({
        header,
        key: key as keyof Record<string, unknown>,
      }))
    : Object.keys(data[0] || {}).map((key) => ({
        header: key,
        key: key as keyof Record<string, unknown>,
      }));

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error('Dışa aktarılacak veri yok');
      return;
    }

    setIsLoading(true);
    try {
      switch (format) {
        case 'json':
          exportJSON(data, filename);
          break;
        case 'html':
          exportHTML(data, filename, title, columns);
          break;
        case 'excel':
          await exportToExcel({
            title,
            filename: `${filename}.xlsx`,
            columns: exportColumns,
            data,
          });
          break;
        case 'pdf':
          await exportToPDF({
            title,
            filename: `${filename}.pdf`,
            columns: exportColumns,
            data,
          });
          break;
        case 'csv':
        default:
          exportCSV(data, filename, columns);
          break;
      }
      toast.success(`${format.toUpperCase()} dosyası indirildi`);
    } catch (error) {
      logger.error('Export error', { error });
      toast.error('Dışa aktarma hatası');
    } finally {
      setIsLoading(false);
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    switch (format) {
      case 'excel':
        return <Table className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isLoading}
      aria-label={`${label} - ${format.toUpperCase()} formatında`}
      className="gap-1"
    >
      {getIcon()}
      {label}
    </Button>
  );
}

/**
 * Quick export dropdown for tables
 */
interface QuickExportProps {
  data: Record<string, unknown>[];
  filename: string;
  title?: string;
  columns?: Record<string, string>;
}

export function QuickExport({ data, filename, title = 'Rapor', columns }: QuickExportProps) {
  return (
    <ExportButtons
      data={data}
      filename={filename}
      title={title}
      columns={columns}
      compact={true}
      size="sm"
      variant="outline"
    />
  );
}
