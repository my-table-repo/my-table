import * as React from 'react';
import type { ReactNode } from 'react';

import {
  isRowNumberColumn,
  isSettingsColumn,
  sumColumnWidths,
} from '@my-table/core';
import type { ColumnDef } from '@my-table/core';

import { DataTableColumnSettings } from './components/DataTableColumnSettings';
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

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  return (
    <span className={cn('mt-sort-icon', active && 'mt-sort-icon--active')}>
      {active ? (desc ? '↓' : '↑') : '↕'}
    </span>
  );
}

type ResizeHandleProps = {
  columnId: string;
  isActive: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
};

function ColumnResizeHandle({
  columnId,
  isActive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${columnId} column`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={(event) => event.stopPropagation()}
      className={cn('mt-resize-handle', isActive && 'mt-resize-handle--active')}
    >
      <span
        className={cn(
          'mt-resize-handle-line',
          isActive && 'mt-resize-handle-line--active',
        )}
      />
    </div>
  );
}

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

  const blockSortClickRef = React.useRef(false);
  const headerRefs = React.useRef<Record<string, HTMLTableCellElement | null>>({});
  const visibleColumnIds = allColumns.map((col) => col.id).join(',');

  React.useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    table.scaleWidthsToFit(container.clientWidth);
  }, [visibleColumnIds, table]);

  const tableWidth = sumColumnWidths(allColumns, columnWidths);

  const handleResizeStart = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, columnIndex: number) => {
      const column = allColumns[columnIndex];
      const nextColumn = allColumns[columnIndex + 1];

      if (!column || !nextColumn) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const headerCell = headerRefs.current[column.id];
      const neighborCell = headerRefs.current[nextColumn.id];

      if (!headerCell || !neighborCell) {
        return;
      }

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

  const settingsHeader = React.useMemo(
    () => <DataTableColumnSettings table={table} />,
    [table],
  );

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
                const isSpecial = isSpecialColumn(column.id);
                const canResize =
                  resizable &&
                  column.enableResize !== false &&
                  columnIndex < allColumns.length - 1 &&
                  !isSettingsColumn(allColumns[columnIndex + 1]!.id);
                const sortable =
                  column.accessor &&
                  column.enableSorting !== false &&
                  !isSpecial;
                const active = sorting?.id === column.id;

                return (
                  <th
                    key={column.id}
                    ref={(element) => {
                      headerRefs.current[column.id] = element;
                    }}
                    style={{ width: columnWidths[column.id] }}
                    className={cn(
                      'mt-th',
                      sortable && 'mt-sort-header',
                      column.headerClassName,
                    )}
                    onClick={
                      sortable
                        ? () => {
                            if (blockSortClickRef.current) {
                              blockSortClickRef.current = false;
                              return;
                            }
                            table.toggleSort(column.id);
                          }
                        : undefined
                    }
                  >
                    {isSettingsColumn(column.id) ? (
                      settingsHeader
                    ) : (
                      <span className="mt-sort-label">
                        {column.header as ReactNode}
                        {sortable ? (
                          <SortIcon active={active} desc={sorting?.desc ?? false} />
                        ) : null}
                      </span>
                    )}
                    {canResize ? (
                      <ColumnResizeHandle
                        columnId={column.id}
                        isActive={activeResizeIndex === columnIndex}
                        onPointerDown={(event) =>
                          handleResizeStart(event, columnIndex)
                        }
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeEnd}
                      />
                    ) : null}
                  </th>
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
                  <tr
                    key={rowKey}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      'mt-tr',
                      onRowClick && 'mt-tr--clickable',
                      isSelected && 'mt-tr--selected',
                    )}
                    onClick={
                      onRowClick
                        ? (event) => {
                            const target = event.target as HTMLElement;

                            if (target.closest('[data-prevent-row-click]')) {
                              return;
                            }

                            onRowClick(row.original);
                          }
                        : undefined
                    }
                  >
                    {allColumns.map((column) => (
                      <td
                        key={column.id}
                        style={{ width: columnWidths[column.id] }}
                        className={cn(
                          'mt-td',
                          !isSpecialColumn(column.id) && 'mt-td--truncate',
                          column.className,
                        )}
                      >
                        {isRowNumberColumn(column.id)
                          ? rowNumberOffset + rowIndex + 1
                          : column.cell
                            ? (column.cell(row.original) as ReactNode)
                            : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isSpecialColumn(columnId: string): boolean {
  return isRowNumberColumn(columnId) || isSettingsColumn(columnId);
}
