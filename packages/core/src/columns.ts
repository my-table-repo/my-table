import type { ColumnDef } from './types';
import { getColumnLabel } from './column-preferences';

export function toSortableColumnDefs<T>(
  columns: Array<{
    id: string;
    header?: unknown;
    label?: string;
    accessor?: (row: T) => unknown;
    enableSorting?: boolean;
  }>,
): ColumnDef<T>[] {
  return columns
    .filter((column) => column.accessor)
    .map((column) => ({
      id: column.id,
      header: getColumnLabel(column),
      accessor: column.accessor!,
      enableSorting: column.enableSorting,
    }));
}
