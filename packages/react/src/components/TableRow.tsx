import * as React from 'react';

import type { ColumnDef } from '@my-table/core';

import { cn } from '../lib/utils';
import { TableCell } from './TableCell';

export type TableRowProps<T> = {
  row: { original: T };
  rowIndex: number;
  rowKey: string | number;
  allColumns: ColumnDef<T>[];
  columnWidths: Record<string, number>;
  isSelected: boolean;
  rowNumberOffset: number;
  onRowClick?: (row: T) => void;
};

export function TableRow<T>({
  row,
  rowIndex,
  rowKey,
  allColumns,
  columnWidths,
  isSelected,
  rowNumberOffset,
  onRowClick,
}: TableRowProps<T>) {
  const handleClick = onRowClick
    ? (event: React.MouseEvent<HTMLTableRowElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-prevent-row-click]')) return;
        onRowClick(row.original);
      }
    : undefined;

  return (
    <tr
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'mt-tr',
        onRowClick && 'mt-tr--clickable',
        isSelected && 'mt-tr--selected',
      )}
      onClick={handleClick}
    >
      {allColumns.map((column) => (
        <TableCell
          key={column.id}
          column={column}
          row={row.original}
          columnWidths={columnWidths}
          rowIndex={rowIndex}
          rowNumberOffset={rowNumberOffset}
        />
      ))}
    </tr>
  );
}
