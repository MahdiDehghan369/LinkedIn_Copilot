import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/**
 * @param {{ history: Array<{ fetchedAt: string, engagementRate: number|null }> }} props
 */
export function EngagementChart({ history }) {
  const data = history
    .filter((point) => typeof point.engagementRate === 'number')
    .map((point) => ({
      date: new Date(point.fetchedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      engagementRate: Number((point.engagementRate * 100).toFixed(2)),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-(--color-ink-faint)">Not enough data points to chart yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--color-ink-faint)' }}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Engagement rate']}
          contentStyle={{ borderRadius: 8, borderColor: 'var(--color-line)', fontSize: 13 }}
        />
        <Line type="monotone" dataKey="engagementRate" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
