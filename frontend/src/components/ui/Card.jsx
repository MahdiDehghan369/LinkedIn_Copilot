/**
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-(--color-line) bg-(--color-paper-raised) p-6 shadow-[0_1px_2px_rgba(21,24,31,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * @param {{ message: string }} props
 */
export function ErrorBanner({ message }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-(--color-critical)/30 bg-(--color-critical-soft) px-3.5 py-2.5 text-sm text-(--color-critical)"
    >
      {message}
    </div>
  );
}

/**
 * @param {{ message: string }} props
 */
export function SuccessBanner({ message }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-(--color-positive)/30 bg-(--color-positive-soft) px-3.5 py-2.5 text-sm text-(--color-positive)"
    >
      {message}
    </div>
  );
}
