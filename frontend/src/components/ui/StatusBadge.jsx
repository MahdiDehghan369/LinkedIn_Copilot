const STATUS_STYLES = {
  // Post lifecycle (API.md)
  DRAFT: 'bg-(--color-line)/50 text-(--color-ink-soft)',
  GENERATED: 'bg-(--color-accent-soft) text-(--color-accent)',
  EDITED: 'bg-(--color-accent-soft) text-(--color-accent)',
  APPROVED: 'bg-(--color-positive-soft) text-(--color-positive)',
  SCHEDULED: 'bg-amber-100 text-amber-800',
  PUBLISHING: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-(--color-positive-soft) text-(--color-positive)',
  FAILED: 'bg-(--color-critical-soft) text-(--color-critical)',
  CANCELLED: 'bg-(--color-line)/50 text-(--color-ink-faint)',
  // Content idea status
  proposed: 'bg-(--color-accent-soft) text-(--color-accent)',
  used: 'bg-(--color-positive-soft) text-(--color-positive)',
  dismissed: 'bg-(--color-line)/50 text-(--color-ink-faint)',
  // Generic
  connected: 'bg-(--color-positive-soft) text-(--color-positive)',
  expired: 'bg-(--color-critical-soft) text-(--color-critical)',
  revoked: 'bg-(--color-line)/50 text-(--color-ink-faint)',
};

/**
 * @param {{ status: string, label?: string }} props
 */
export function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] ?? 'bg-(--color-line)/50 text-(--color-ink-soft)';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {label ?? status}
    </span>
  );
}
