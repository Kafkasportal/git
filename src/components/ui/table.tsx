'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Table - Main table wrapper with horizontal scroll
 */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table
        ref={ref}
        role="table"
        aria-label="Data table"
        className={cn(
          'w-full text-sm caption-bottom',
          'border-collapse',
          className
        )}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

/**
 * TableHeader - Header section with professional styling
 */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-muted border-b-2 border-gray-200',
      '[&_tr]:border-0',
      className
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

/**
 * TableBody - Body section with row styling
 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      'divide-y divide-gray-200',
      '[&_tr:last-child]:border-0',
      className
    )}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

/**
 * TableFooter - Footer section with background
 */
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t-2 border-gray-200 bg-muted font-semibold',
      '[&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

/**
 * TableRow - Individual table row with hover effect
 */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }
>(({ className, interactive = true, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-gray-200 transition-all duration-150',
      interactive && 'hover:bg-primary-50 cursor-pointer',
      'data-[state=selected]:bg-primary-100',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

/**
 * TableHead - Table header cell with professional styling
 */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean;
  }
>(({ className, sortable, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-6 py-3 text-left align-middle font-semibold text-foreground uppercase tracking-wide text-xs',
      'bg-muted border-b border-gray-200',
      '[&:has([role=checkbox])]:pr-0',
      sortable && 'cursor-pointer hover:bg-muted/80 select-none',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

/**
 * TableCell - Table data cell with proper spacing
 */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    /**  Center align content */
    center?: boolean;
    /** Right align content */
    right?: boolean;
  }
>(({ className, center, right, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-6 py-4 align-middle text-foreground',
      'border-b border-gray-200',
      '[&:has([role=checkbox])]:pr-0',
      center && 'text-center',
      right && 'text-right',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

/**
 * TableCaption - Table caption below table
 */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      'mt-4 text-sm text-muted-foreground text-center',
      className
    )}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

/**
 * TableEmpty - Empty state component for tables
 */
const TableEmpty = ({ message = 'No data to display' }: { message?: string }) => (
  <tr>
    <td
      colSpan={99}
      className="text-center py-12 text-muted-foreground"
    >
      <p className="text-sm">{message}</p>
    </td>
  </tr>
);
TableEmpty.displayName = 'TableEmpty';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
};
