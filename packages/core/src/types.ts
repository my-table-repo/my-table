import type { ColumnPrefs, ColumnSettingsItem } from './column-preferences';

export type ColumnDef<T> = {
  id: string;
  accessor?: (row: T) => unknown;
  header?: unknown;
  label?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableResizing?: boolean;
  enableResize?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  size?: number;
  minSize?: number;
  maxSize?: number;
  hideable?: boolean;
  defaultHidden?: boolean;
  className?: string;
  headerClassName?: string;
  cell?: (row: T) => unknown;
};

export type TableOptions<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  tableKey?: string;
  enableColumnSettings?: boolean;
  showRowNumbers?: boolean;
  resizable?: boolean;
  plugins?: any[];
  getRowId?: (row: T) => string;
};

export interface TableState {
  [key: string]: unknown;
}

export type Listener = () => void;

export type SortingState = { id: string; desc: boolean } | null;

export type TableRow<T> = {
  id: string;
  original: T;
};

export type Row<T> = {
  id: string;
  original: T;
  getValue: (columnId: string) => unknown;
};

export interface TableInstance<T> {
  getState: () => TableState;
  setState: (updater: (prev: TableState) => TableState) => void;
  subscribe: (listener: Listener) => () => void;
  getRows: () => Row<T>[];
  getColumns: () => ColumnDef<T>[];
  options: TableOptions<T>;
}

export type TableApi<T> = {
  subscribe: (listener: Listener) => () => void;
  getColumns: () => ColumnDef<T>[];
  getSorting: () => SortingState;
  getRows: () => TableRow<T>[];
  getColumnWidths: () => Record<string, number>;
  getActiveResizeIndex: () => number | null;
  toggleSort: (columnId: string) => void;
  toggleColumnVisibility: (columnId: string) => void;
  reorderColumns: (activeId: string, overId: string) => void;
  resetPreferences: () => void;
  startResize: (columnIndex: number, startX: number, startWidth: number, neighborStartWidth: number) => void;
  resizeMove: (clientX: number) => void;
  endResize: () => void;
  scaleWidthsToFit: (containerWidth: number) => void;
  setColumnWidths: (widths: Record<string, number> | ((current: Record<string, number>) => Record<string, number>)) => void;
  getStateVersion: () => number;
  getColumnSettingsItems: () => ColumnSettingsItem[];
};
