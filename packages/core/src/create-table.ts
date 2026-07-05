import type { ColumnDef, Listener, SortingState, TableApi, TableRow } from './types';

export function createTable<T>(opts: {
  data: T[];
  columns: ColumnDef<T>[];
}): TableApi<T> {
  const listeners = new Set<Listener>();
  let sorting: SortingState = null;

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getColumns: () => opts.columns,
    toggleSort(columnId: string) {
      sorting =
        !sorting || sorting.id !== columnId
          ? { id: columnId, desc: false }
          : !sorting.desc
            ? { id: columnId, desc: true }
            : null;
      notify();
    },
    getSorting: () => sorting,
    getRows() {
      let rows: TableRow<T>[] = opts.data.map((original, i) => ({
        id: String(i),
        original,
      }));

      if (sorting) {
        const col = opts.columns.find((c) => c.id === sorting!.id)!;
        rows = [...rows].sort((a, b) => {
          const av = col.accessor(a.original) as string | number;
          const bv = col.accessor(b.original) as string | number;
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sorting!.desc ? -cmp : cmp;
        });
      }

      return rows;
    },
  };
}
