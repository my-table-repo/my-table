import * as React from 'react';
import type { ReactNode } from 'react';

import {
  canResizeColumnPair,
  canSortColumn,
  createRowNumberColumnMeta,
  createSettingsColumnMeta,
  getInitialColumnWidths,
  isRowNumberColumn,
  isSettingsColumn,
  mergeColumnWidths,
  resolvePairColumnResize,
  scaleColumnWidthsToFit,
  sumColumnWidths,
  toSortableColumnDefs,
} from '@my-table/core';
import type { ColumnPreferenceInput, SizedColumn } from '@my-table/core';

import { DataTableColumnSettings } from './components/DataTableColumnSettings';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import { useDataTableColumnPreferences } from './hooks/useDataTableColumnPreferences';
import { cn } from './lib/utils';
import { useTable } from './useTable';

export type DataTableColumn<T> = Omit<ColumnPreferenceInput, 'header'> &
  SizedColumn & {
    header: ReactNode;
    accessor?: (row: T) => unknown;
    cell: (row: T) => ReactNode;
    enableSorting?: boolean;
    enableResize?: boolean;
    className?: string;
    headerClassName?: string;
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

type LayoutColumn<T> = DataTableColumn<T> & { id: string };

type ResizeSession = {
  columnIndex: number;
  pointerId: number;
  startX: number;
  startWidth: number;
  neighborStartWidth: number;
};

function withRowNumberColumn<T>(
  columns: LayoutColumn<T>[],
  showRowNumbers: boolean,
): LayoutColumn<T>[] {
  if (!showRowNumbers) {
    return columns;
  }

  const meta = createRowNumberColumnMeta();

  return [
    {
      ...meta,
      header: '#',
      headerClassName: 'text-center',
      className: 'text-center text-muted-foreground tabular-nums',
      cell: () => null,
    },
    ...columns,
  ];
}

function withSettingsColumn<T>(
  columns: LayoutColumn<T>[],
  settingsHeader: ReactNode,
  enabled: boolean,
): LayoutColumn<T>[] {
  if (!enabled) {
    return columns;
  }

  const meta = createSettingsColumnMeta();

  return [
    ...columns,
    {
      ...meta,
      header: settingsHeader,
      headerClassName: 'p-0 text-center',
      className: 'p-0',
      cell: () => null,
    },
  ];
}

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  if (!active) {
    return <span className="text-[11px] opacity-40">↕</span>;
  }

  return <span className="text-[11px] text-primary">{desc ? '↓' : '↑'}</span>;
}

function ColumnResizeHandle({
  columnId,
  isActive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  columnId: string;
  isActive: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
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
      className="group/handle absolute right-0 top-0 z-10 flex h-full w-5 translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
    >
      <span
        className={cn(
          'h-6 w-1 rounded-full bg-border shadow-sm transition-colors',
          'group-hover/handle:bg-muted-foreground/70',
          isActive && 'bg-primary',
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
  const columnSettingsEnabled = enableColumnSettings && Boolean(tableKey);

  const {
    visibleColumns,
    settingsItems,
    reorderColumns,
    toggleColumnVisibility,
    resetPreferences,
  } = useDataTableColumnPreferences(tableKey ?? 'default', columns, columnSettingsEnabled);

  const dataColumns = columnSettingsEnabled ? visibleColumns : columns;
  const sortableColumns = React.useMemo(
    () => toSortableColumnDefs(dataColumns),
    [dataColumns],
  );
  const table = useTable({ data, columns: sortableColumns });
  const sorting = table.getSorting();
  const displayData = React.useMemo(
    () =>
      sortableColumns.length > 0
        ? table.getRows().map((row) => row.original)
        : data,
    [data, sortableColumns.length, table, sorting],
  );

  const settingsHeader = React.useMemo(
    () => (
      <DataTableColumnSettings
        columns={settingsItems}
        onReorder={reorderColumns}
        onToggleVisibility={toggleColumnVisibility}
        onReset={resetPreferences}
      />
    ),
    [reorderColumns, resetPreferences, settingsItems, toggleColumnVisibility],
  );

  const allColumns = React.useMemo(
    () =>
      withSettingsColumn(
        withRowNumberColumn(dataColumns, showRowNumbers),
        settingsHeader,
        columnSettingsEnabled,
      ),
    [columnSettingsEnabled, dataColumns, settingsHeader, showRowNumbers],
  );

  const [columnWidths, setColumnWidths] = React.useState(() =>
    getInitialColumnWidths(allColumns),
  );
  const [activeResizeIndex, setActiveResizeIndex] = React.useState<number | null>(
    null,
  );
  const resizeRef = React.useRef<ResizeSession | null>(null);
  const blockSortClickRef = React.useRef(false);
  const headerRefs = React.useRef<Record<string, HTMLTableCellElement | null>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasNormalizedRef = React.useRef(false);

  React.useEffect(() => {
    setColumnWidths((current) => mergeColumnWidths(allColumns, current));
  }, [allColumns]);

  React.useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || hasNormalizedRef.current) {
      return;
    }

    hasNormalizedRef.current = true;

    setColumnWidths((current) =>
      scaleColumnWidthsToFit(allColumns, current, container.clientWidth),
    );
  }, [allColumns]);

  const tableWidth = sumColumnWidths(allColumns, columnWidths);

  const handleResizeStart = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, columnIndex: number) => {
      if (!canResizeColumnPair(allColumns, columnIndex, resizable)) {
        return;
      }

      const column = allColumns[columnIndex]!;
      const nextColumn = allColumns[columnIndex + 1]!;

      event.preventDefault();
      event.stopPropagation();

      const headerCell = headerRefs.current[column.id];
      const neighborCell = headerRefs.current[nextColumn.id];

      if (!headerCell || !neighborCell) {
        return;
      }

      resizeRef.current = {
        columnIndex,
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: headerCell.getBoundingClientRect().width,
        neighborStartWidth: neighborCell.getBoundingClientRect().width,
      };

      setActiveResizeIndex(columnIndex);
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [allColumns, resizable],
  );

  const handleResizeMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const resize = resizeRef.current;

      if (!resize || event.pointerId !== resize.pointerId) {
        return;
      }

      const column = allColumns[resize.columnIndex];
      const nextColumn = allColumns[resize.columnIndex + 1];

      if (!column || !nextColumn) {
        return;
      }

      const delta = event.clientX - resize.startX;
      const { left, right } = resolvePairColumnResize(
        column,
        nextColumn,
        resize.startWidth,
        resize.neighborStartWidth,
        delta,
      );

      setColumnWidths((current) => ({
        ...current,
        [column.id]: left,
        [nextColumn.id]: right,
      }));
    },
    [allColumns],
  );

  const handleResizeEnd = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const resize = resizeRef.current;

      if (!resize || event.pointerId !== resize.pointerId) {
        return;
      }

      resizeRef.current = null;
      setActiveResizeIndex(null);
      blockSortClickRef.current = true;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    },
    [],
  );

  const wrapperClassName =
    variant === 'default'
      ? 'overflow-hidden rounded-lg border border-border bg-background'
      : 'overflow-x-auto';

  return (
    <div
      ref={containerRef}
      className={cn(
        wrapperClassName,
        fillHeight && 'flex h-full min-h-0 flex-col',
        className,
      )}
    >
      <div className={cn('overflow-x-auto', fillHeight && 'min-h-0 flex-1')}>
        <Table
          className={cn('table-fixed', tableClassName)}
          style={{ width: tableWidth }}
        >
          <colgroup>
            {allColumns.map((column) => (
              <col key={column.id} style={{ width: columnWidths[column.id] }} />
            ))}
          </colgroup>

          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {allColumns.map((column, columnIndex) => {
                const canResize = canResizeColumnPair(
                  allColumns,
                  columnIndex,
                  resizable,
                );
                const sortable = canSortColumn(column);
                const active = sorting?.id === column.id;

                return (
                  <TableHead
                    key={column.id}
                    ref={(element) => {
                      headerRefs.current[column.id] = element;
                    }}
                    style={{ width: columnWidths[column.id] }}
                    className={cn(
                      'relative select-none',
                      sortable && 'cursor-pointer',
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
                      <div className="flex justify-center">{column.header}</div>
                    ) : (
                      <span className="inline-flex items-center gap-1 truncate pr-4">
                        {column.header}
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
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={allColumns.length}
                  className="h-16 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row, rowIndex) => {
                const rowKey = getRowKey(row);
                const isSelected =
                  selectedRowKey !== null && selectedRowKey === rowKey;

                return (
                  <TableRow
                    key={rowKey}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-muted/40 hover:bg-muted/40',
                    )}
                    onClick={
                      onRowClick
                        ? (event) => {
                            const target = event.target as HTMLElement;

                            if (target.closest('[data-prevent-row-click]')) {
                              return;
                            }

                            onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {allColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        style={{ width: columnWidths[column.id] }}
                        className={cn(
                          !isSpecialLayoutColumn(column.id) && 'truncate',
                          column.className,
                        )}
                      >
                        {isRowNumberColumn(column.id)
                          ? rowNumberOffset + rowIndex + 1
                          : column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function isSpecialLayoutColumn(columnId: string): boolean {
  return isRowNumberColumn(columnId) || isSettingsColumn(columnId);
}
