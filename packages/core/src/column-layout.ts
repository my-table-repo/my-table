import {
  COLUMN_SETTINGS_COLUMN_ID,
  COLUMN_SETTINGS_WIDTH,
  ROW_NUMBER_COLUMN_ID,
  ROW_NUMBER_WIDTH,
} from './constants';
import type { SizedColumn } from './column-sizing';

export function isRowNumberColumn(columnId: string): boolean {
  return columnId === ROW_NUMBER_COLUMN_ID;
}

export function isSettingsColumn(columnId: string): boolean {
  return columnId === COLUMN_SETTINGS_COLUMN_ID;
}

export function isSpecialColumn(columnId: string): boolean {
  return isRowNumberColumn(columnId) || isSettingsColumn(columnId);
}

export function createRowNumberColumnMeta(): SizedColumn & {
  enableResize: false;
} {
  return {
    id: ROW_NUMBER_COLUMN_ID,
    width: ROW_NUMBER_WIDTH,
    minWidth: ROW_NUMBER_WIDTH,
    maxWidth: ROW_NUMBER_WIDTH,
    enableResize: false,
  };
}

export function createSettingsColumnMeta(): SizedColumn & {
  enableResize: false;
} {
  return {
    id: COLUMN_SETTINGS_COLUMN_ID,
    width: COLUMN_SETTINGS_WIDTH,
    minWidth: COLUMN_SETTINGS_WIDTH,
    maxWidth: COLUMN_SETTINGS_WIDTH,
    enableResize: false,
  };
}

export function canResizeColumnPair<T extends SizedColumn & { enableResize?: boolean }>(
  columns: T[],
  columnIndex: number,
  resizable: boolean,
): boolean {
  const column = columns[columnIndex];
  const nextColumn = columns[columnIndex + 1];

  return Boolean(
    resizable &&
      column &&
      nextColumn &&
      column.enableResize !== false &&
      nextColumn.id !== COLUMN_SETTINGS_COLUMN_ID &&
      columnIndex < columns.length - 1,
  );
}

export function canSortColumn(
  column: { id: string; accessor?: unknown; enableSorting?: boolean },
): boolean {
  return Boolean(
    column.accessor &&
      column.enableSorting !== false &&
      !isSpecialColumn(column.id),
  );
}
