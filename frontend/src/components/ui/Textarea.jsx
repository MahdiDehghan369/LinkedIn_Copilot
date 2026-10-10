/**
 * @param {{
 *   id: string,
 *   label?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   error?: string,
 *   placeholder?: string,
 *   rows?: number,
 *   helperText?: string,
 * }} props
 */
export function Textarea({ id, label, value, onChange, error, placeholder, rows = 4, helperText }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-(--color-ink)">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`w-full resize-y rounded-lg border bg-(--color-paper-raised) px-3.5 py-2.5 text-sm leading-relaxed text-(--color-ink) outline-none placeholder:text-(--color-ink-faint) focus:border-(--color-accent) ${
          error ? 'border-(--color-critical)' : 'border-(--color-line)'
        }`}
      />
      {helperText && !error && <p className="mt-1.5 text-xs text-(--color-ink-faint)">{helperText}</p>}
      {error && <p className="mt-1.5 text-sm text-(--color-critical)">{error}</p>}
    </div>
  );
}
