import * as React from 'react';
import type { ReactNode } from 'react';

import {
  isSettingsColumn,
  sumColumnWidths,
} from '@my-table/core';
import type { ColumnDef } from '@my-table/core';

import { DataTableColumnSettings } from './components/DataTableColumnSettings';
import { TableHeaderCell } from './components/TableHeader';
import { TableRow } from './components/TableRow';
import { cn } from './lib/utils';
import { useTable } from './useTable';

export type DataTableColumn<T> = Omit<ColumnDef<T>, 'header' | 'cell'> & {
  header: ReactNode;
  cell: (row: T) => ReactNode;
};

/** @deprecated Use `DataTableColumn` instead */
export type ReactColumnDef<T> = DataTableColumn<T>;

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  resizable?: boolean;
  variant?: 'default' | 'plain';
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | number | null;
  fillHeight?: boolean;
  showRowNumbers?: boolean;
  rowNumberOffset?: number;
  tableKey?: string;
  enableColumnSettings?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No results found.',
  className,
  tableClassName,
  resizable = true,
  variant = 'default',
  onRowClick,
  selectedRowKey = null,
  fillHeight = false,
  showRowNumbers = true,
  rowNumberOffset = 0,
  tableKey,
  enableColumnSettings = true,
}: DataTableProps<T>) {
  const table = useTable({
    data,
    columns: columns as ColumnDef<T>[],
    tableKey,
    enableColumnSettings,
    showRowNumbers,
    resizable,
  });

  const allColumns = table.getColumns();
  const columnWidths = table.getColumnWidths();
  const activeResizeIndex = table.getActiveResizeIndex();
  const sorting = table.getSorting();
  const displayRows = table.getRows();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const blockSortClickRef = React.useRef(false);
  const headerRefs = React.useRef<Record<string, HTMLTableCellElement | null>>({});
  const visibleColumnIds = allColumns.map((col) => col.id).join(',');

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    table.scaleWidthsToFit(container.clientWidth);
  }, [visibleColumnIds, table]);

  const tableWidth = sumColumnWidths(allColumns, columnWidths);

  // ─── Resize handlers ─────────────────────────────────────────────────────

  const handleResizeStart = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, columnIndex: number) => {
      const column = allColumns[columnIndex];
      const nextColumn = allColumns[columnIndex + 1];
      if (!column || !nextColumn) return;

      event.preventDefault();
      event.stopPropagation();

      const headerCell = headerRefs.current[column.id];
      const neighborCell = headerRefs.current[nextColumn.id];
      if (!headerCell || !neighborCell) return;

      table.startResize(
        columnIndex,
        event.clientX,
        headerCell.getBoundingClientRect().width,
        neighborCell.getBoundingClientRect().width,
      );

      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [allColumns, table],
  );

  const handleResizeMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      table.resizeMove(event.clientX);
    },
    [table],
  );

  const handleResizeEnd = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      table.endResize();
      blockSortClickRef.current = true;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    },
    [table],
  );

  // ─── Memoised stable values ───────────────────────────────────────────────

  const settingsHeader = <DataTableColumnSettings table={table} />;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={cn(
        'mt-theme',
        'mt-wrapper',
        variant === 'default' ? 'mt-wrapper--default' : 'mt-wrapper--plain',
        fillHeight && 'mt-wrapper--fill-height',
        className,
      )}
    >
      <div className="mt-container">
        <table
          className={cn('mt-table', tableClassName)}
          style={{ width: tableWidth }}
        >
          <colgroup>
            {allColumns.map((column) => (
              <col key={column.id} style={{ width: columnWidths[column.id] }} />
            ))}
          </colgroup>

          <thead className="mt-thead">
            <tr className="mt-tr mt-tr--header">
              {allColumns.map((column, columnIndex) => {
                const nextColumn = allColumns[columnIndex + 1];
                const canResize =
                  resizable &&
                  column.enableResize !== false &&
                  columnIndex < allColumns.length - 1 &&
                  !isSettingsColumn(nextColumn!.id);

                return (
                  <TableHeaderCell
                    key={column.id}
                    column={column}
                    columnIndex={columnIndex}
                    columnWidths={columnWidths}
                    sorting={sorting}
                    activeResizeIndex={activeResizeIndex}
                    canResize={canResize}
                    headerRef={(el) => {
                      headerRefs.current[column.id] = el;
                    }}
                    settingsContent={settingsHeader}
                    onSort={() => {
                      if (blockSortClickRef.current) {
                        blockSortClickRef.current = false;
                        return;
                      }
                      table.toggleSort(column.id);
                    }}
                    onResizeStart={(event) =>
                      handleResizeStart(event, columnIndex)
                    }
                    onResizeMove={handleResizeMove}
                    onResizeEnd={handleResizeEnd}
                  />
                );
              })}
            </tr>
          </thead>

          <tbody className="mt-tbody">
            {displayRows.length === 0 ? (
              <tr className="mt-tr mt-tr--header">
                <td colSpan={allColumns.length} className="mt-td--empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayRows.map((row, rowIndex) => {
                const rowKey = getRowKey(row.original);
                const isSelected =
                  selectedRowKey !== null && selectedRowKey === rowKey;

                return (
                  <TableRow
                    key={rowKey}
                    row={row}
                    rowIndex={rowIndex}
                    rowKey={rowKey}
                    allColumns={allColumns}
                    columnWidths={columnWidths}
                    isSelected={isSelected}
                    rowNumberOffset={rowNumberOffset}
                    onRowClick={onRowClick}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
