/**
 * @param {{
 *   id: string,
 *   label: string,
 *   type?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   error?: string,
 *   autoComplete?: string,
 *   placeholder?: string,
 *   disabled?: boolean,
 * }} props
 */
export function TextField({ id, label, type = 'text', value, onChange, error, autoComplete, placeholder, disabled = false }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-(--color-ink)">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-(--color-paper-raised) px-3.5 py-2.5 text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-faint) focus:border-(--color-accent) disabled:cursor-not-allowed disabled:bg-(--color-paper) disabled:text-(--color-ink-faint) ${
          error ? 'border-(--color-critical)' : 'border-(--color-line)'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-(--color-critical)">
          {error}
        </p>
      )}
    </div>
  );
}
