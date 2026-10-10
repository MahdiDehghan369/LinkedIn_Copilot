import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-(--color-paper) text-center">
      <p className="font-mono text-sm text-(--color-ink-faint)">404</p>
      <h1 className="font-display text-xl font-semibold text-(--color-ink)">Page not found</h1>
      <Link to="/" className="text-sm font-medium text-(--color-accent) hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
