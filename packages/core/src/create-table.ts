import type {
  ColumnDef,
  Listener,
  SortingState,
  TableApi,
  TableRow,
  TableOptions,
} from './types';
import {
  createInitialColumnPreferences,
  createLocalStorageColumnPreferencesStorage,
  getColumnSettingsItems,
  getVisibleColumns,
  reorderColumnPrefs,
  resetColumnPreferences,
  syncColumnPreferences,
  toggleColumnVisibilityPrefs,
} from './column-preferences';
import type { ColumnPrefs, ColumnSettingsItem } from './column-preferences';
import {
  canResizeColumnPair,
  createRowNumberColumnMeta,
  createSettingsColumnMeta,
} from './column-layout';
import {
  getInitialColumnWidths,
  mergeColumnWidths,
  resolvePairColumnResize,
  scaleColumnWidthsToFit,
} from './column-sizing';
import { DEFAULT_COLUMN_WIDTH } from './constants';

export function createTable<T>(opts: TableOptions<T>): TableApi<T> {
  const listeners = new Set<Listener>();

  // State
  let sorting: SortingState = null;
  let activeResizeIndex: number | null = null;
  
  // Resize Session Info
  let resizeSession: {
    columnIndex: number;
    startX: number;
    startWidth: number;
    neighborStartWidth: number;
  } | null = null;

  const storage = createLocalStorageColumnPreferencesStorage();
  
  // Preferences State
  const preferencesEnabled = Boolean(opts.enableColumnSettings && opts.tableKey);
  let prefs: ColumnPrefs = preferencesEnabled && opts.tableKey
    ? createInitialColumnPreferences(opts.columns, opts.tableKey, storage)
    : resetColumnPreferences(opts.columns);

  // Column Sizing State
  function getLayoutColumnsList(currentPrefs: ColumnPrefs): ColumnDef<T>[] {
    const dataCols = preferencesEnabled ? getVisibleColumns(opts.columns, currentPrefs) : opts.columns;
    
    let result = [...dataCols];
    
    if (opts.showRowNumbers) {
      const rowMeta = createRowNumberColumnMeta() as ColumnDef<T>;
      rowMeta.header = '#';
      rowMeta.className = 'text-center text-muted-foreground tabular-nums';
      rowMeta.headerClassName = 'text-center';
      result.unshift(rowMeta);
    }
    
    if (preferencesEnabled) {
      const settingsMeta = createSettingsColumnMeta() as ColumnDef<T>;
      settingsMeta.headerClassName = 'p-0 text-center';
      settingsMeta.className = 'p-0';
      result.push(settingsMeta);
    }
    
    return result;
  }

  let layoutColumns = getLayoutColumnsList(prefs);
  let columnWidths = getInitialColumnWidths(layoutColumns);

  let stateVersion = 0;

  function notify() {
    stateVersion++;
    listeners.forEach((listener) => listener());
  }

  function syncPrefs(newPrefs: ColumnPrefs) {
    prefs = newPrefs;
    if (preferencesEnabled && opts.tableKey) {
      storage.set(opts.tableKey, prefs);
    }
    layoutColumns = getLayoutColumnsList(prefs);
    columnWidths = mergeColumnWidths(layoutColumns, columnWidths);
    notify();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    getColumns() {
      return layoutColumns.map((col) => ({
        ...col,
        width: columnWidths[col.id] ?? DEFAULT_COLUMN_WIDTH,
      }));
    },
    
    getSorting() {
      return sorting;
    },
    
    getRows() {
      let rows: TableRow<T>[] = opts.data.map((original, i) => ({
        id: String(i),
        original,
      }));

      if (sorting) {
        const col = opts.columns.find((c) => c.id === sorting!.id);
        if (col && col.accessor) {
          const accessor = col.accessor;
          rows = [...rows].sort((a, b) => {
            const av = accessor(a.original) as string | number;
            const bv = accessor(b.original) as string | number;
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return sorting!.desc ? -cmp : cmp;
          });
        }
      }

      return rows;
    },
    
    getColumnWidths() {
      return columnWidths;
    },
    
    getActiveResizeIndex() {
      return activeResizeIndex;
    },
    
    toggleSort(columnId) {
      sorting =
        !sorting || sorting.id !== columnId
          ? { id: columnId, desc: false }
          : !sorting.desc
            ? { id: columnId, desc: true }
            : null;
      notify();
    },
    
    toggleColumnVisibility(columnId) {
      syncPrefs(toggleColumnVisibilityPrefs(prefs, columnId));
    },
    
    reorderColumns(activeId, overId) {
      syncPrefs(reorderColumnPrefs(prefs, activeId, overId));
    },
    
    resetPreferences() {
      syncPrefs(resetColumnPreferences(opts.columns));
    },
    
    startResize(columnIndex, startX, startWidth, neighborStartWidth) {
      if (!canResizeColumnPair(layoutColumns, columnIndex, opts.resizable !== false)) {
        return;
      }
      activeResizeIndex = columnIndex;
      resizeSession = {
        columnIndex,
        startX,
        startWidth,
        neighborStartWidth,
      };
      notify();
    },
    
    resizeMove(clientX) {
      if (!resizeSession || activeResizeIndex === null) {
        return;
      }
      const column = layoutColumns[resizeSession.columnIndex];
      const nextColumn = layoutColumns[resizeSession.columnIndex + 1];
      if (!column || !nextColumn) {
        return;
      }
      
      const delta = clientX - resizeSession.startX;
      const { left, right } = resolvePairColumnResize(
        column,
        nextColumn,
        resizeSession.startWidth,
        resizeSession.neighborStartWidth,
        delta,
      );
      
      columnWidths = {
        ...columnWidths,
        [column.id]: left,
        [nextColumn.id]: right,
      };
      notify();
    },
    
    endResize() {
      activeResizeIndex = null;
      resizeSession = null;
      notify();
    },
    
    scaleWidthsToFit(containerWidth) {
      columnWidths = scaleColumnWidthsToFit(layoutColumns, columnWidths, containerWidth);
      notify();
    },
    
    setColumnWidths(widths) {
      if (typeof widths === 'function') {
        columnWidths = widths(columnWidths);
      } else {
        columnWidths = widths;
      }
      notify();
    },
    
    getStateVersion() {
      return stateVersion;
    },
    
    getColumnSettingsItems() {
      return preferencesEnabled ? getColumnSettingsItems(opts.columns, prefs) : [];
    },
  };
}
