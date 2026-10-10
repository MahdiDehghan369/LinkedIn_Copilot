const LABELS = {
  hook: 'Hook',
  readability: 'Readability',
  technicalValue: 'Technical value',
  engagement: 'Engagement',
  cta: 'CTA',
};

/**
 * @param {{ scores: Record<string, number> }} props
 */
export function ScoreBars({ scores }) {
  return (
    <div className="space-y-2.5">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-(--color-ink-soft)">{LABELS[key] ?? key}</span>
            <span className="text-(--color-ink-faint)">{value}/10</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-(--color-line)">
            <div
              className="h-full rounded-full bg-(--color-accent)"
              style={{ width: `${Math.max(0, Math.min(100, (value / 10) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
