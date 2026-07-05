// packages/react/src/useTable.ts
import { useMemo, useSyncExternalStore } from 'react';
import { createTable } from '../../core/src/table';
import { TableOptions } from '../../core/src/types';

export function useTable<T>(options: TableOptions<T>) {
  const table = useMemo(() => createTable(options), []); // deps handled carefully in real impl
  useSyncExternalStore(table.subscribe, table.getState);
  return table; // has .getRows(), .setSorting(), .toggleSort(), etc. — fully typed
}