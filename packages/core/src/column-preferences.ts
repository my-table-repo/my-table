import { COLUMN_PREFERENCES_STORAGE_PREFIX } from './constants';

export type ColumnPreferenceInput = {
  id: string;
  label?: string;
  header?: unknown;
  hideable?: boolean;
  defaultHidden?: boolean;
};

export type ColumnPrefs = {
  order: string[];
  hidden: string[];
};

export type ColumnSettingsItem = {
  id: string;
  label: string;
  visible: boolean;
  hideable: boolean;
};

export type ColumnPreferencesStorage = {
  get: (key: string) => ColumnPrefs | null;
  set: (key: string, prefs: ColumnPrefs) => void;
};

export function getDefaultColumnOrder(columns: ColumnPreferenceInput[]): string[] {
  return columns.map((column) => column.id);
}

export function getDefaultHiddenColumns(columns: ColumnPreferenceInput[]): string[] {
  return columns.filter((column) => column.defaultHidden).map((column) => column.id);
}

export function mergeColumnOrder(
  defaultOrder: string[],
  storedOrder: string[],
): string[] {
  const valid = storedOrder.filter((id) => defaultOrder.includes(id));
  const missing = defaultOrder.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

export function getColumnLabel(column: {
  id: string;
  label?: string;
  header?: unknown;
}): string {
  if (column.label) {
    return column.label;
  }

  if (typeof column.header === 'string') {
    return column.header;
  }

  return column.id;
}

export function createInitialColumnPreferences(
  columns: ColumnPreferenceInput[],
  tableKey: string,
  storage?: ColumnPreferencesStorage,
): ColumnPrefs {
  const defaultOrder = getDefaultColumnOrder(columns);
  const stored = storage?.get(tableKey);

  return {
    order: stored ? mergeColumnOrder(defaultOrder, stored.order) : defaultOrder,
    hidden: stored?.hidden ?? getDefaultHiddenColumns(columns),
  };
}

export function syncColumnPreferences(
  columns: ColumnPreferenceInput[],
  prefs: ColumnPrefs,
): ColumnPrefs {
  const defaultOrder = getDefaultColumnOrder(columns);

  return {
    order: mergeColumnOrder(defaultOrder, prefs.order),
    hidden: prefs.hidden.filter((id) => defaultOrder.includes(id)),
  };
}

export function getVisibleColumns<T extends ColumnPreferenceInput>(
  columns: T[],
  prefs: ColumnPrefs,
): T[] {
  const byId = Object.fromEntries(columns.map((column) => [column.id, column]));

  return prefs.order
    .filter((id) => !prefs.hidden.includes(id) && byId[id])
    .map((id) => byId[id]!);
}

export function getColumnSettingsItems(
  columns: ColumnPreferenceInput[],
  prefs: ColumnPrefs,
): ColumnSettingsItem[] {
  const byId = Object.fromEntries(columns.map((column) => [column.id, column]));

  return prefs.order
    .filter((id) => byId[id])
    .map((id) => {
      const column = byId[id]!;

      return {
        id,
        label: getColumnLabel(column),
        visible: !prefs.hidden.includes(id),
        hideable: column.hideable !== false,
      };
    });
}

export function reorderColumnPrefs(
  prefs: ColumnPrefs,
  activeId: string,
  overId: string,
): ColumnPrefs {
  const from = prefs.order.indexOf(activeId);
  const to = prefs.order.indexOf(overId);

  if (from < 0 || to < 0 || from === to) {
    return prefs;
  }

  const order = [...prefs.order];
  order.splice(from, 1);
  order.splice(to, 0, activeId);

  return { ...prefs, order };
}

export function toggleColumnVisibilityPrefs(
  prefs: ColumnPrefs,
  columnId: string,
): ColumnPrefs {
  if (prefs.hidden.includes(columnId)) {
    return {
      ...prefs,
      hidden: prefs.hidden.filter((id) => id !== columnId),
    };
  }

  const visibleCount = prefs.order.filter((id) => !prefs.hidden.includes(id)).length;
  if (visibleCount <= 1) {
    return prefs;
  }

  return {
    ...prefs,
    hidden: [...prefs.hidden, columnId],
  };
}

export function resetColumnPreferences(
  columns: ColumnPreferenceInput[],
): ColumnPrefs {
  return {
    order: getDefaultColumnOrder(columns),
    hidden: getDefaultHiddenColumns(columns),
  };
}

export function createMemoryColumnPreferencesStorage(): ColumnPreferencesStorage {
  const store = new Map<string, ColumnPrefs>();

  return {
    get: (key) => store.get(key) ?? null,
    set: (key, prefs) => {
      store.set(key, prefs);
    },
  };
}

export function createLocalStorageColumnPreferencesStorage(
  prefix = COLUMN_PREFERENCES_STORAGE_PREFIX,
): ColumnPreferencesStorage {
  return {
    get: (key) => {
      if (typeof localStorage === 'undefined') {
        return null;
      }

      try {
        const raw = localStorage.getItem(prefix + key);
        return raw ? (JSON.parse(raw) as ColumnPrefs) : null;
      } catch {
        return null;
      }
    },
    set: (key, prefs) => {
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.setItem(prefix + key, JSON.stringify(prefs));
    },
  };
}
