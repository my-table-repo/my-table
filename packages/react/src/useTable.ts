import { useMemo, useSyncExternalStore } from 'react';
import { createTable } from '@my-table/core';
import type { ColumnDef } from '@my-table/core';

export function useTable<T>(opts: { data: T[]; columns: ColumnDef<T>[] }) {
  const columnKey = opts.columns.map((c) => c.id).join('\0');
  const table = useMemo(
    () => createTable(opts),
    [opts.data, columnKey],
  );
  useSyncExternalStore(table.subscribe, () => table.getSorting());
  return table;
}
