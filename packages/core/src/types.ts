import type { Plugin } from "./plugins/types";

export type ColumnDef<T> = {
    id: string;
    accessor: (row: T) => unknown;
    header?: string;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enableResizing?: boolean;
    size?: number;
    minSize?: number;
    maxSize?: number;
  };
  
  export type TableOptions<T> = {
    data: T[];
    columns: ColumnDef<T>[];
    plugins?: Plugin<T, any>[];
    getRowId?: (row: T) => string;
  };
  
  // The engine's internal mutable state. Plugins extend this via declaration merging.
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
    // plugin-injected methods get merged in at the type level (see below)
  }
  
  export type Row<T> = {
    id: string;
    original: T;
    getValue: (columnId: string) => unknown;
  };