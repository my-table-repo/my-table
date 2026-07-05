export type ColumnDef<T> = {
    id: string;
    accessor: (row: T) => unknown;
    header: string;
    enableSorting?: boolean;
    width?: number | string;
  };
  
  export type SortingState = { id: string; desc: boolean } | null;
  
  export function createTable<T>(opts: {
    data: T[];
    columns: ColumnDef<T>[];
  }) {
    const listeners = new Set<() => void>();
    let sorting: SortingState = null;
  
    function notify() {
      listeners.forEach((l) => l());
    }
  
    return {
      subscribe(l: () => void) {
        listeners.add(l);
        return () => listeners.delete(l);
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
        let rows = opts.data.map((original, i) => ({ id: String(i), original }));
        if (sorting) {
          const col = opts.columns.find((c) => c.id === sorting!.id)!;
          rows = [...rows].sort((a, b) => {
            const av = col.accessor(a.original) as any;
            const bv = col.accessor(b.original) as any;
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return sorting!.desc ? -cmp : cmp;
          });
        }
        return rows;
      },
    };
  }