import { DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from './constants';

export type SizedColumn = {
  id: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
};

export function getInitialColumnWidths<T extends SizedColumn>(
  columns: T[],
): Record<string, number> {
  return Object.fromEntries(
    columns.map((column) => [column.id, column.width ?? DEFAULT_COLUMN_WIDTH]),
  );
}

export function clampColumnWidth(width: number, column: SizedColumn): number {
  const min = column.minWidth ?? MIN_COLUMN_WIDTH;
  const max = column.maxWidth ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(width, min), max);
}

export function sumColumnWidths<T extends SizedColumn>(
  columns: T[],
  widths: Record<string, number>,
): number {
  return columns.reduce(
    (total, column) => total + (widths[column.id] ?? DEFAULT_COLUMN_WIDTH),
    0,
  );
}

export function scaleColumnWidthsToFit<T extends SizedColumn>(
  columns: T[],
  widths: Record<string, number>,
  containerWidth: number,
): Record<string, number> {
  const total = sumColumnWidths(columns, widths);

  if (total <= 0 || containerWidth <= 0) {
    return widths;
  }

  const scale = containerWidth / total;

  return Object.fromEntries(
    columns.map((column) => [
      column.id,
      Math.round((widths[column.id] ?? DEFAULT_COLUMN_WIDTH) * scale),
    ]),
  );
}

export function mergeColumnWidths<T extends SizedColumn>(
  columns: T[],
  current: Record<string, number>,
): Record<string, number> {
  const next = { ...current };

  for (const column of columns) {
    if (!(column.id in next)) {
      next[column.id] = column.width ?? DEFAULT_COLUMN_WIDTH;
    }
  }

  return next;
}

export function resolvePairColumnResize<T extends SizedColumn>(
  leftColumn: T,
  rightColumn: T,
  startLeft: number,
  startRight: number,
  delta: number,
): { left: number; right: number } {
  const total = startLeft + startRight;
  let left = clampColumnWidth(startLeft + delta, leftColumn);
  let right = total - left;

  right = clampColumnWidth(right, rightColumn);
  left = total - right;
  left = clampColumnWidth(left, leftColumn);
  right = total - left;

  return { left, right };
}
