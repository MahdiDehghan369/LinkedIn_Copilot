import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { useLinkedInStatus } from '../../hooks/useLinkedIn.js';

export function LinkedInStatusPill() {
  const { data, isLoading } = useLinkedInStatus();

  if (isLoading) return null;

  const connected = Boolean(data?.connected);

  return (
    <Link
      to="/linkedin"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        connected
          ? 'border-(--color-positive)/30 bg-(--color-positive-soft) text-(--color-positive)'
          : 'border-(--color-line) bg-(--color-paper) text-(--color-ink-soft) hover:bg-(--color-line)/50'
      }`}
      title={connected ? 'LinkedIn connected' : 'LinkedIn not connected'}
    >
      <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
      {connected ? 'Connected' : 'Not connected'}
    </Link>
  );
}
