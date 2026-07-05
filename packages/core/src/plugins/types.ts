// packages/core/src/plugins/types.ts

import type { Row, TableInstance, TableState } from "../types";

export interface Plugin<T, ExtraMethods = {}> {
    name: string;
    initState?: () => Partial<TableState>;
    // Each plugin gets a chance to transform the row list, in order.
    // e.g. filtering removes rows, sorting reorders, pagination slices.
    processRows?: (rows: Row<T>[], state: TableState, table: TableInstance<T>) => Row<T>[];
    // Attach new methods/actions to the table instance (e.g. table.setSorting())
    extend?: (table: TableInstance<T>) => ExtraMethods;
  }