export type ColumnDef<T> = {
  id: string;
  accessor: (row: T) => unknown;
  header?: string;
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
};

export type TableOptions<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  plugins?: import('./plugins/types').Plugin<T, any>[];
  getRowId?: (row: T) => string;
};

export interface TableState {
  [key: string]: unknown;
}

export type Listener = () => void;

export interface TableInstance<T> {
  getState: () => TableState;
  setState: (updater: (prev: TableState) => TableState) => void;
  subscribe: (listener: Listener) => () => void;
  getRows: () => Row<T>[];
  getColumns: () => ColumnDef<T>[];
  options: TableOptions<T>;
}

export type Row<T> = {
  id: string;
  original: T;
  getValue: (columnId: string) => unknown;
};

export type SortingState = { id: string; desc: boolean } | null;

export type TableRow<T> = {
  id: string;
  original: T;
};

export type TableApi<T> = {
  subscribe: (listener: Listener) => () => void;
  getColumns: () => ColumnDef<T>[];
  toggleSort: (columnId: string) => void;
  getSorting: () => SortingState;
  getRows: () => TableRow<T>[];
};
