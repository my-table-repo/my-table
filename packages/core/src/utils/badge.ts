/**
 * Utility to get the standardized CSS class name for a status badge.
 * Works framework-agnostically by returning class names defined in the CSS theme.
 */
export function getStatusBadgeClassName(status: unknown): string {
  const v = String(status ?? '').toLowerCase().trim();
  return `mt-badge mt-badge--${v}`;
}
