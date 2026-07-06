import { useMemo, useSyncExternalStore } from 'react';
import { createTable } from '@my-table/core';
import type { TableOptions } from '@my-table/core';

export function useTable<T>(opts: TableOptions<T>) {
  const columnKey = opts.columns.map((c) => c.id).join('\0');
  const table = useMemo(
    () => createTable(opts),
    [
      opts.data,
      columnKey,
      opts.tableKey,
      opts.enableColumnSettings,
      opts.showRowNumbers,
      opts.resizable,
    ],
  );

  useSyncExternalStore(table.subscribe, () => table.getStateVersion());

  return table;
}
