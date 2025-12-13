'use client';

import React, { ReactNode, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import type { ResponsiveColumn } from './responsive-table';

interface TableRowProps {
  row: Record<string, unknown>;
  rowKey: string;
  columns: ResponsiveColumn[];
  index: number;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

function DesktopTableRow({ row, rowKey, columns, index, onRowClick, actions }: TableRowProps) {
  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  const visibleColumns = columns.filter((col) => col.hidden !== 'desktop');
  const rowKeyValue = String(row[rowKey]);
  const rowClassName = `border-b hover:bg-primary/5 transition-colors cursor-pointer ${
    index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
  }`;

  return (
    <tr key={rowKeyValue} className={rowClassName} onClick={handleClick}>
      {visibleColumns.map((col) => {
        const cellValue = col.render ? col.render(row[col.key], row) : String(row[col.key] || '-');
        return (
          <td key={`${rowKeyValue}-${col.key}`} className="px-4 py-3 text-sm text-gray-900">
            {cellValue}
          </td>
        );
      })}
      {actions && <td className="px-4 py-3 text-sm">{actions(row)}</td>}
    </tr>
  );
}

interface DesktopTableProps {
  columns: ResponsiveColumn[];
  data: Record<string, unknown>[];
  rowKey: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

export function DesktopTableView({ columns, data, rowKey, onRowClick, actions }: DesktopTableProps) {
  const visibleColumns = columns.filter((col) => col.hidden !== 'desktop');

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            {visibleColumns.map((col) => (
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
            <DesktopTableRow
              key={String(row[rowKey])}
              row={row}
              rowKey={rowKey}
              columns={columns}
              index={index}
              onRowClick={onRowClick}
              actions={actions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TabletCardProps {
  row: Record<string, unknown>;
  rowKey: string;
  columns: ResponsiveColumn[];
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

function TabletCard({ row, rowKey, columns, onRowClick, actions }: TabletCardProps) {
  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  const visibleColumns = columns
    .filter((col) => col.hidden !== 'tablet' && col.hidden !== 'mobile-tablet')
    .slice(0, 4);
  const rowKeyValue = String(row[rowKey]);

  return (
    <Card
      key={rowKeyValue}
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="grid grid-cols-2 gap-3">
        {visibleColumns.map((col) => {
          const cellValue = col.render ? col.render(row[col.key], row) : String(row[col.key] || '-');
          return (
            <div key={`${rowKeyValue}-${col.key}`}>
              <p className="text-xs font-medium text-gray-500 uppercase">{col.label}</p>
              <p className="text-sm text-gray-900 mt-1">{cellValue}</p>
            </div>
          );
        })}
      </div>
      {actions && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2">{actions(row)}</div>
        </div>
      )}
    </Card>
  );
}

interface TabletViewProps {
  columns: ResponsiveColumn[];
  data: Record<string, unknown>[];
  rowKey: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

export function TabletTableView({ columns, data, rowKey, onRowClick, actions }: TabletViewProps) {
  return (
    <div className="hidden md:lg:grid gap-4 grid-cols-1 lg:hidden">
      {data.map((row) => (
        <TabletCard
          key={String(row[rowKey])}
          row={row}
          rowKey={rowKey}
          columns={columns}
          onRowClick={onRowClick}
          actions={actions}
        />
      ))}
    </div>
  );
}

interface MobileCardProps {
  row: Record<string, unknown>;
  rowKey: string;
  columns: ResponsiveColumn[];
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

function MobileCard({ row, rowKey, columns, onRowClick, actions }: MobileCardProps) {
  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  const visibleColumns = columns
    .filter((col) => col.hidden !== 'mobile' && col.hidden !== 'mobile-tablet')
    .slice(0, 3);
  const rowKeyValue = String(row[rowKey]);

  return (
    <Card
      key={rowKeyValue}
      className="p-4 space-y-3 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {visibleColumns.map((col) => {
        const cellValue = col.render ? col.render(row[col.key], row) : String(row[col.key] || '-');
        return (
          <div key={`${rowKeyValue}-${col.key}`} className="flex justify-between items-start">
            <p className="text-xs font-medium text-gray-500 uppercase">{col.label}</p>
            <p className="text-sm text-gray-900 text-right max-w-[50%]">{cellValue}</p>
          </div>
        );
      })}
      {actions && <div className="flex gap-2 pt-3 border-t">{actions(row)}</div>}
    </Card>
  );
}

interface MobileViewProps {
  columns: ResponsiveColumn[];
  data: Record<string, unknown>[];
  rowKey: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
}

export function MobileTableView({ columns, data, rowKey, onRowClick, actions }: MobileViewProps) {
  return (
    <div className="md:hidden space-y-4">
      {data.map((row) => (
        <MobileCard
          key={String(row[rowKey])}
          row={row}
          rowKey={rowKey}
          columns={columns}
          onRowClick={onRowClick}
          actions={actions}
        />
      ))}
    </div>
  );
}

