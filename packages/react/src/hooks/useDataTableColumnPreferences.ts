import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createInitialColumnPreferences,
  createLocalStorageColumnPreferencesStorage,
  getColumnSettingsItems,
  getVisibleColumns,
  reorderColumnPrefs,
  resetColumnPreferences,
  syncColumnPreferences,
  toggleColumnVisibilityPrefs,
} from '@my-table/core';
import type { ColumnPrefs } from '@my-table/core';

const storage = createLocalStorageColumnPreferencesStorage();

type PreferenceColumn = {
  id: string;
  label?: string;
  header?: unknown;
  hideable?: boolean;
  defaultHidden?: boolean;
};

export function useDataTableColumnPreferences<T extends PreferenceColumn>(
  tableKey: string,
  columns: T[],
  enabled: boolean,
) {
  const columnIds = useMemo(
    () => columns.map((column) => column.id).join('\0'),
    [columns],
  );

  const [prefs, setPrefs] = useState<ColumnPrefs>(() =>
    enabled
      ? createInitialColumnPreferences(columns, tableKey, storage)
      : resetColumnPreferences(columns),
  );

  useEffect(() => {
    setPrefs((current) => syncColumnPreferences(columns, current));
  }, [columnIds, columns]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    storage.set(tableKey, prefs);
  }, [enabled, prefs, tableKey]);

  const visibleColumns = useMemo(
    () => (enabled ? getVisibleColumns(columns, prefs) : columns),
    [columns, enabled, prefs],
  );

  const settingsItems = useMemo(
    () => (enabled ? getColumnSettingsItems(columns, prefs) : []),
    [columns, enabled, prefs],
  );

  const reorderColumns = useCallback((activeId: string, overId: string) => {
    setPrefs((current) => reorderColumnPrefs(current, activeId, overId));
  }, []);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setPrefs((current) => toggleColumnVisibilityPrefs(current, columnId));
  }, []);

  const resetPreferences = useCallback(() => {
    setPrefs(resetColumnPreferences(columns));
  }, [columns]);

  return {
    visibleColumns,
    settingsItems,
    reorderColumns,
    toggleColumnVisibility,
    resetPreferences,
  };
}
