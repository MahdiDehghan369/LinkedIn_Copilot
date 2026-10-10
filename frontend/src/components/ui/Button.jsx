/**
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'ghost' | 'danger',
 *   size?: 'md' | 'sm',
 *   type?: 'button' | 'submit',
 *   disabled?: boolean,
 *   loading?: boolean,
 *   onClick?: () => void,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const sizes = {
    md: 'px-4 py-2.5 text-sm',
    sm: 'px-3 py-1.5 text-xs',
  };
  const variants = {
    primary: 'bg-(--color-accent) text-(--color-accent-ink) hover:brightness-110',
    secondary:
      'border border-(--color-line) bg-(--color-paper-raised) text-(--color-ink) hover:bg-(--color-paper)',
    ghost: 'text-(--color-ink-soft) hover:bg-(--color-line)/60',
    danger: 'bg-(--color-critical) text-white hover:brightness-110',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
