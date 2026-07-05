import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTable } from './useTable';
import type { ColumnDef } from '@my-table/core';

export type ReactColumnDef<T> = ColumnDef<T> & {
  cell?: (value: unknown, row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
};

export type DataTableProps<T> = {
  data: T[];
  columns: ReactColumnDef<T>[];
  getRowId?: (row: T) => string;
  emptyMessage?: string;
  showFilters?: boolean;      // <- the toggle you mentioned earlier
  striped?: boolean;
  dense?: boolean;
  onRowClick?: (row: T) => void;
};

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  if (!active) return <span className="mt-sort-icon mt-sort-icon--idle">↕</span>;
  return <span className="mt-sort-icon mt-sort-icon--active">{desc ? '↓' : '↑'}</span>;
}

export function DataTable<T>({
  data,
  columns,
  emptyMessage = 'No data',
  showFilters = false,
  striped = false,
  dense = false,
  onRowClick,
}: DataTableProps<T>) {
  const table = useTable({ data, columns });
  const sorting = table.getSorting();
  const rows = table.getRows();

  const classes = useMemo(
    () =>
      [
        'mt-table',
        striped && 'mt-table--striped',
        dense && 'mt-table--dense',
      ]
        .filter(Boolean)
        .join(' '),
    [striped, dense],
  );

  return (
    <div className="mt-card">
      {showFilters && (
        <div className="mt-toolbar">
          {/* filter inputs slot in here once filteringPlugin lands */}
        </div>
      )}

      <table className={classes}>
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sorting?.id === col.id;
              return (
                <th
                  key={col.id}
                  className={active ? 'mt-th mt-th--sorted' : 'mt-th'}
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                  onClick={() => col.enableSorting !== false && table.toggleSort(col.id)}
                >
                  <span className="mt-th-label">
                    {col.header}
                    {col.enableSorting !== false && <SortIcon active={active} desc={sorting?.desc ?? false} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="mt-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="mt-row"
                onClick={() => onRowClick?.(row.original)}
              >
                {columns.map((col) => {
                  const value = col.accessor(row.original);
                  return (
                    <td key={col.id} style={{ textAlign: col.align ?? 'left' }}>
                      {col.cell ? col.cell(value, row.original) : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}