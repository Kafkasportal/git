'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export interface ResponsiveColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
  hidden?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet';
}

interface ResponsiveTableProps {
  columns: ResponsiveColumn[];
  data: Record<string, unknown>[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  rowKey: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

/**
 * Responsive table component that adapts layout based on screen size
 * Desktop: Traditional table
 * Tablet: Card-based with key columns
 * Mobile: Stacked card layout
 */
export function ResponsiveTable({
  columns,
  data,
  isLoading,
  isEmpty,
  emptyMessage = 'Veri bulunamadı',
  rowKey,
  onRowClick,
  actions,
}: ResponsiveTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop View - Traditional Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              {columns
                .filter((col) => col.hidden !== 'desktop')
                .map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${col.width || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              {actions && (
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksiyon</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={String(row[rowKey])}
                className={`border-b hover:bg-primary/5 transition-colors cursor-pointer ${
                  index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns
                  .filter((col) => col.hidden !== 'desktop')
                  .map((col) => (
                    <td
                      key={`${String(row[rowKey])}-${col.key}`}
                      className="px-4 py-3 text-sm text-gray-900"
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] || '-')}
                    </td>
                  ))}
                {actions && <td className="px-4 py-3 text-sm">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet View - Cards with Key Columns */}
      <div className="hidden md:lg:grid gap-4 grid-cols-1 lg:hidden">
        {data.map((row) => (
          <Card
            key={String(row[rowKey])}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onRowClick?.(row)}
          >
            <div className="grid grid-cols-2 gap-3">
              {columns
                .filter((col) => col.hidden !== 'tablet' && col.hidden !== 'mobile-tablet')
                .slice(0, 4)
                .map((col) => (
                  <div key={`${String(row[rowKey])}-${col.key}`}>
                    <p className="text-xs font-medium text-gray-500 uppercase">{col.label}</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] || '-')}
                    </p>
                  </div>
                ))}
            </div>
            {actions && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">{actions(row)}</div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Mobile View - Stacked Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <Card
            key={String(row[rowKey])}
            className="p-4 space-y-3 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onRowClick?.(row)}
          >
            {columns
              .filter((col) => col.hidden !== 'mobile' && col.hidden !== 'mobile-tablet')
              .slice(0, 3)
              .map((col) => (
                <div
                  key={`${String(row[rowKey])}-${col.key}`}
                  className="flex justify-between items-start"
                >
                  <p className="text-xs font-medium text-gray-500 uppercase">{col.label}</p>
                  <p className="text-sm text-gray-900 text-right max-w-[50%]">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] || '-')}
                  </p>
                </div>
              ))}
            {actions && <div className="flex gap-2 pt-3 border-t">{actions(row)}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Responsive grid list for larger items
 */
interface ResponsiveGridProps {
  data: Record<string, unknown>[];
  renderCard: (item: Record<string, unknown>) => ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  itemsPerRow?: { mobile: number; tablet: number; desktop: number };
}

export function ResponsiveGrid({
  data,
  renderCard,
  isLoading,
  isEmpty,
  emptyMessage = 'Veri bulunamadı',
  itemsPerRow = { mobile: 1, tablet: 2, desktop: 3 },
}: ResponsiveGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 grid-cols-${itemsPerRow.mobile} md:grid-cols-${itemsPerRow.tablet} lg:grid-cols-${itemsPerRow.desktop}`}
    >
      {data.map((item, index) => (
        <div key={`item-${index}`}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
