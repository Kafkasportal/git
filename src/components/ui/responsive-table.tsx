'use client';

import React, { ReactNode } from 'react';
import { DesktopTableView, TabletTableView, MobileTableView } from './responsive-table-parts';

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
      <DesktopTableView
        columns={columns}
        data={data}
        rowKey={rowKey}
        onRowClick={onRowClick}
        actions={actions}
      />
      <TabletTableView
        columns={columns}
        data={data}
        rowKey={rowKey}
        onRowClick={onRowClick}
        actions={actions}
      />
      <MobileTableView
        columns={columns}
        data={data}
        rowKey={rowKey}
        onRowClick={onRowClick}
        actions={actions}
      />
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
