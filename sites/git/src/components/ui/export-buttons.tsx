'use client';

import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { exportCSV, exportJSON, exportHTML, printTable } from '@/lib/export';
import { useState } from 'react';

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename: string;
  title?: string;
  columns?: Record<string, string>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
  compact?: boolean;
}

/**
 * Export buttons group for common formats
 */
export function ExportButtons({
  data,
  filename,
  title,
  columns,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  compact = false,
}: ExportButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Dışa aktarma seçeneklerini aç"
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          {showLabel && 'İndir'}
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                exportCSV(data, filename, columns);
                setIsOpen(false);
              }}
              aria-label="CSV formatında indir"
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => {
                exportJSON(data, filename);
                setIsOpen(false);
              }}
              aria-label="JSON formatında indir"
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2"
            >
              <FileJson className="h-4 w-4" />
              JSON
            </button>
            <button
              onClick={() => {
                exportHTML(data, filename, title, columns);
                setIsOpen(false);
              }}
              aria-label="HTML formatında indir"
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              HTML
            </button>
            <button
              onClick={() => {
                printTable(data, title, columns);
                setIsOpen(false);
              }}
              aria-label="Tabloyu yazdır"
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2 border-t"
            >
              <Download className="h-4 w-4" />
              Yazdır
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant={variant}
        size={size}
        onClick={() => exportCSV(data, filename, columns)}
        aria-label="CSV formatında indir"
        title="CSV formatında indir"
        className="gap-1"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {showLabel && 'CSV'}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => exportJSON(data, filename)}
        aria-label="JSON formatında indir"
        title="JSON formatında indir"
        className="gap-1"
      >
        <FileJson className="h-4 w-4" />
        {showLabel && 'JSON'}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => exportHTML(data, filename, title, columns)}
        aria-label="HTML formatında indir"
        title="HTML formatında indir"
        className="gap-1"
      >
        <FileText className="h-4 w-4" />
        {showLabel && 'HTML'}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => printTable(data, title, columns)}
        aria-label="Tabloyu yazdır"
        title="Yazdır"
        className="gap-1"
      >
        <Download className="h-4 w-4" />
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
  format?: 'csv' | 'json' | 'html';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  label?: string;
  columns?: Record<string, string>;
}

export function SimpleExportButton({
  data,
  filename,
  format = 'csv',
  variant = 'outline',
  size = 'sm',
  label = 'İndir',
  columns,
}: SimpleExportButtonProps) {
  const handleExport = () => {
    switch (format) {
      case 'json':
        exportJSON(data, filename);
        break;
      case 'html':
        exportHTML(data, filename, label, columns);
        break;
      case 'csv':
      default:
        exportCSV(data, filename, columns);
        break;
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      aria-label={`${label} - ${format.toUpperCase()} formatında`}
      className="gap-1"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
