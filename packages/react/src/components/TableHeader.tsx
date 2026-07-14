import * as React from 'react';
import type { ReactNode } from 'react';

import { isSettingsColumn } from '@my-table/core';
import type { ColumnDef } from '@my-table/core';

import { cn } from '../lib/utils';

// ─── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  return (
    <span className={cn('mt-sort-icon', active && 'mt-sort-icon--active')}>
      {active ? (desc ? '↓' : '↑') : '↕'}
    </span>
  );
}

// ─── ColumnResizeHandle ───────────────────────────────────────────────────────

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

// ─── TableHeaderCell ──────────────────────────────────────────────────────────

export type TableHeaderCellProps<T> = {
  column: ColumnDef<T>;
  columnIndex: number;
  columnWidths: Record<string, number>;
  sorting: { id: string; desc: boolean } | null;
  activeResizeIndex: number | null;
  canResize: boolean;
  headerRef: (el: HTMLTableCellElement | null) => void;
  settingsContent: ReactNode;
  onSort: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export function TableHeaderCell<T>({
  column,
  columnIndex,
  columnWidths,
  sorting,
  activeResizeIndex,
  canResize,
  headerRef,
  settingsContent,
  onSort,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: TableHeaderCellProps<T>) {
  const isSettings = isSettingsColumn(column.id);
  const isSpecial =
    isSettings || column.id === '__row_number__' || column.id === '__settings__';
  const sortable = !!(
    column.accessor &&
    column.enableSorting !== false &&
    !isSpecial
  );
  const active = sorting?.id === column.id;

  return (
    <th
      ref={headerRef}
      style={{ width: columnWidths[column.id] }}
      className={cn(
        'mt-th',
        sortable && 'mt-sort-header',
        column.headerClassName,
      )}
      onClick={sortable ? onSort : undefined}
    >
      {isSettings ? (
        settingsContent
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
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        />
      ) : null}
    </th>
  );
}
