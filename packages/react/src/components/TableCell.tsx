import type { ReactNode } from 'react';

import { isRowNumberColumn, isSettingsColumn } from '@my-table/core';
import type { ColumnDef } from '@my-table/core';

import { cn } from '../lib/utils';

export type TableCellProps<T> = {
  column: ColumnDef<T>;
  row: T;
  columnWidths: Record<string, number>;
  rowIndex: number;
  rowNumberOffset: number;
};

export function TableCell<T>({
  column,
  row,
  columnWidths,
  rowIndex,
  rowNumberOffset,
}: TableCellProps<T>) {
  const isSpecial = isRowNumberColumn(column.id) || isSettingsColumn(column.id);

  return (
    <td
      style={{ width: columnWidths[column.id] }}
      className={cn('mt-td', !isSpecial && 'mt-td--truncate', column.className)}
    >
      {isRowNumberColumn(column.id)
        ? rowNumberOffset + rowIndex + 1
        : column.cell
          ? (column.cell(row) as ReactNode)
          : null}
    </td>
  );
}
