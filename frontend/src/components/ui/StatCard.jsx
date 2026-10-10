/**
 * @param {{ label: string, value: import('react').ReactNode, icon?: import('react').ComponentType<{ className?: string }> }} props
 */
export function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-(--color-line) bg-(--color-paper-raised) p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-(--color-ink-soft)">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-(--color-ink-faint)" strokeWidth={1.75} />}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-(--color-ink)">{value}</p>
    </div>
  );
}
