/**
 * @param {{
 *   tabs: Array<{ id: string, label: string }>,
 *   activeTab: string,
 *   onChange: (id: string) => void,
 * }} props
 */
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-(--color-line)">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-(--color-accent) text-(--color-accent)'
                : 'border-transparent text-(--color-ink-soft) hover:text-(--color-ink)'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
