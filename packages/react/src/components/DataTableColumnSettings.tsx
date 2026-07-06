import * as React from 'react';
import type { TableApi } from '@my-table/core';
import { GripVerticalIcon, RotateCcwIcon, Settings2Icon } from './icons';
import { cn } from '../lib/utils';

type Props<T> = {
  table: TableApi<T>;
};

export function DataTableColumnSettings<T>({ table }: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const columns = table.getColumnSettingsItems();
  const visibleCount = columns.filter((column) => column.visible).length;

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="mt-settings">
      <button
        type="button"
        className="mt-settings-trigger"
        data-prevent-row-click
        aria-label="Column settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings2Icon style={{ width: 16, height: 16 }} />
      </button>

      {open ? (
        <div className="mt-settings-dropdown" data-prevent-row-click>
          <div className="mt-settings-title">Columns</div>
          <p className="mt-settings-desc">
            Drag to reorder. Toggle visibility for columns you do not need.
          </p>

          <div className="mt-settings-list">
            {columns.map((column) => {
              const isDragged = draggedId === column.id;
              const isDragOver =
                dragOverId === column.id && draggedId !== column.id;
              const disableHide = column.visible && visibleCount <= 1;

              return (
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => setDraggedId(column.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverId(column.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === column.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();

                    if (draggedId && draggedId !== column.id) {
                      table.reorderColumns(draggedId, column.id);
                    }

                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  className={cn(
                    'mt-settings-item',
                    isDragged && 'mt-settings-item--dragged',
                    isDragOver && 'mt-settings-item--drag-over',
                  )}
                >
                  <button
                    type="button"
                    className="mt-settings-grab"
                    aria-label={`Reorder ${column.label}`}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <GripVerticalIcon style={{ width: 16, height: 16 }} />
                  </button>
                  <input
                    type="checkbox"
                    checked={column.visible}
                    disabled={!column.hideable || disableHide}
                    onChange={() => table.toggleColumnVisibility(column.id)}
                    className="mt-settings-checkbox"
                    aria-label={`Toggle ${column.label} column`}
                  />
                  <span
                    className={cn(
                      'mt-settings-label',
                      !column.visible && 'mt-settings-label--hidden',
                    )}
                  >
                    {column.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-settings-separator" />

          <button
            type="button"
            className="mt-settings-reset"
            onClick={() => table.resetPreferences()}
          >
            <RotateCcwIcon style={{ width: 13, height: 13 }} />
            Reset columns
          </button>
        </div>
      ) : null}
    </div>
  );
}
