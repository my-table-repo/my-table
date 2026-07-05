import * as React from 'react';

import { GripVerticalIcon, RotateCcwIcon, Settings2Icon } from './icons';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

import type { ColumnSettingsItem } from '@my-table/core';

type Props = {
  columns: ColumnSettingsItem[];
  onReorder: (activeId: string, overId: string) => void;
  onToggleVisibility: (columnId: string) => void;
  onReset: () => void;
};

export function DataTableColumnSettings({
  columns,
  onReorder,
  onToggleVisibility,
  onReset,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground"
        data-prevent-row-click
        aria-label="Column settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings2Icon className="size-4" />
      </Button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-background p-2 shadow-md"
          data-prevent-row-click
        >
          <div className="px-1 py-1 text-sm font-medium">Columns</div>
          <p className="px-1 pb-2 text-xs text-muted-foreground">
            Drag to reorder. Toggle visibility for columns you do not need.
          </p>

          <div className="space-y-1">
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
                      onReorder(draggedId, column.id);
                    }

                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-md border border-transparent px-1 py-1.5',
                    isDragged && 'opacity-50',
                    isDragOver && 'border-border bg-muted/50',
                  )}
                >
                  <button
                    type="button"
                    className="cursor-grab text-muted-foreground active:cursor-grabbing"
                    aria-label={`Reorder ${column.label}`}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>
                  <Checkbox
                    checked={column.visible}
                    disabled={!column.hideable || disableHide}
                    onCheckedChange={() => onToggleVisibility(column.id)}
                    aria-label={`Toggle ${column.label} column`}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      !column.visible && 'text-muted-foreground',
                    )}
                  >
                    {column.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="my-2 h-px bg-border" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onReset}
          >
            <RotateCcwIcon className="size-3.5" />
            Reset columns
          </Button>
        </div>
      ) : null}
    </div>
  );
}
