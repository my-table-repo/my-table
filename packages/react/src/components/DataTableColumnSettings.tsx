import * as React from 'react';
import * as ReactDOM from 'react-dom';
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

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Position state for the fixed portal dropdown
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});

  const columns = table.getColumnSettingsItems();
  const visibleCount = columns.filter((column) => column.visible).length;

  // Recalculate position whenever the dropdown opens or on scroll/resize
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
      // Width and z-index come from the CSS class; just ensure no left override
      left: 'auto',
    });
  }, []);

  React.useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Click-outside: close if click lands outside both the trigger and the portal
  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    // Reposition on scroll or resize while open
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, updatePosition]);

  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="mt-theme mt-settings-dropdown"
          data-prevent-row-click
          style={dropdownStyle}
        >
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
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="mt-settings">
      <button
        ref={triggerRef}
        type="button"
        className="mt-settings-trigger"
        data-prevent-row-click
        aria-label="Column settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings2Icon style={{ width: 16, height: 16 }} />
      </button>

      {dropdown}
    </div>
  );
}
