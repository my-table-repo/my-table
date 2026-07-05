// packages/core/src/table.ts

import type { Listener, Row, TableInstance, TableOptions, TableState } from "./types";

export function createTable<T>(options: TableOptions<T>): TableInstance<T> {
    const listeners = new Set<Listener>();
    let state: TableState = {};
  
    // 1. Merge initial state from every plugin
    for (const plugin of options.plugins ?? []) {
      state = { ...state, ...plugin.initState?.() };
    }
  
    const table: TableInstance<T> = {
      options,
      getState: () => state,
      setState: (updater) => {
        state = updater(state);
        listeners.forEach((l) => l());
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getColumns: () => options.columns,
      getRows: () => {
        let rows: Row<T>[] = options.data.map((original, i) => ({
          id: options.getRowId?.(original) ?? String(i),
          original,
          getValue: (columnId) =>
            options.columns.find((c) => c.id === columnId)?.accessor(original),
        }));
  
        // 2. Run every plugin's processRows in sequence — order matters
        // (filter -> sort -> paginate is the sane default order)
        for (const plugin of options.plugins ?? []) {
          rows = plugin.processRows?.(rows, state, table) ?? rows;
        }
        return rows;
      },
    };
  
    // 3. Attach plugin methods directly onto the instance
    for (const plugin of options.plugins ?? []) {
      Object.assign(table, plugin.extend?.(table));
    }
  
    return table;
  }