/**
 * @param {{
 *   icon?: import('react').ComponentType<{ className?: string }>,
 *   title: string,
 *   description?: string,
 *   action?: import('react').ReactNode,
 * }} props
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-(--color-line) px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-(--color-ink-faint)" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-(--color-ink)">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-(--color-ink-soft)">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
