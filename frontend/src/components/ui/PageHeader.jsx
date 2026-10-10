/**
 * @param {{ title: string, subtitle?: string, actions?: import('react').ReactNode }} props
 */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-(--color-ink)">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-(--color-ink-soft)">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
