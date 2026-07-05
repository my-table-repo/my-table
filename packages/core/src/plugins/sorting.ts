// packages/core/src/plugins/sorting.ts

import type { Plugin } from "./types";

export type SortingState = { id: string; desc: boolean }[];

export function sortingPlugin<T>(): Plugin<T, {
  setSorting: (s: SortingState) => void;
  toggleSort: (columnId: string) => void;
}> {
  return {
    name: 'sorting',
    initState: () => ({ sorting: [] as SortingState }),

    processRows: (rows, state) => {
      const sorting = state.sorting as SortingState;
      if (!sorting?.length) return rows;
      const [entry] = sorting;
      if (!entry) return rows;
      const { id, desc } = entry;
      return [...rows].sort((a, b) => {
        const av = a.getValue(id), bv = b.getValue(id);
        const cmp = av! < bv! ? -1 : av! > bv! ? 1 : 0;
        return desc ? -cmp : cmp;
      });
    },

    extend: (table) => ({
      setSorting: (s) => table.setState((prev) => ({ ...prev, sorting: s })),
      toggleSort: (columnId) => table.setState((prev) => {
        const current = prev.sorting as SortingState;
        const existing = current.find((s) => s.id === columnId);
        const next = !existing
          ? [{ id: columnId, desc: false }]
          : !existing.desc
          ? [{ id: columnId, desc: true }]
          : [];
        return { ...prev, sorting: next };
      }),
    }),
  };
}