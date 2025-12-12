'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileSpreadsheet, FileText, Table } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToTSV, exportToPDF } from '@/lib/data-export';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface ExportMenuProps {
  data: readonly Record<string, unknown>[] | object[];
  filename?: string;
  title?: string; // For PDF
  disabled?: boolean;
}

export function ExportMenu({ data, filename = 'export', title = 'Export', disabled }: ExportMenuProps) {
  const handleExport = async (format: 'csv' | 'json' | 'tsv' | 'pdf') => {
    try {
      // Convert to mutable array for export functions
      const exportData = data.map(item => ({ ...item })) as Record<string, unknown>[];
      const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      switch (format) {
        case 'csv':
          exportToCSV(exportData, { filename: finalFilename });
          break;
        case 'json':
          exportToJSON(exportData, { filename: finalFilename });
          break;
        case 'tsv':
          exportToTSV(exportData, { filename: finalFilename });
          break;
        case 'pdf':
          await exportToPDF(exportData, title, { filename: finalFilename });
          break;
      }
      
      toast.success(`${format.toUpperCase()} olarak dışa aktarıldı`);
    } catch (error) {
      toast.error('Dışa aktarma başarısız oldu');
      logger.error('Export failed', error instanceof Error ? error : undefined, error instanceof Error ? undefined : { error });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled || !data.length}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Dışa Aktar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format Seçin</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('tsv')}>
          <Table className="mr-2 h-4 w-4" />
          TSV (Tablo)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          JSON (Veri)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          PDF (Yazdır)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
