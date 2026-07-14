import * as React from 'react';
import { getStatusBadgeClassName } from '@my-table/core';
import { cn } from '../lib/utils';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: unknown;
}

export function StatusBadge({ value, className, ...props }: StatusBadgeProps) {
  const badgeClass = getStatusBadgeClassName(value);
  return (
    <span className={cn(badgeClass, className)} {...props}>
      {String(value ?? '')}
    </span>
  );
}
