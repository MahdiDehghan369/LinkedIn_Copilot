/**
 * @param {{
 *   id: string,
 *   label?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: Array<{ value: string, label: string }>,
 *   placeholder?: string,
 * }} props
 */
export function Select({ id, label, value, onChange, options, placeholder }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-(--color-ink)">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-(--color-line) bg-(--color-paper-raised) px-3.5 py-2.5 text-sm text-(--color-ink) outline-none focus:border-(--color-accent)"
      >
        {placeholder && (
          <option value="" disabled={value !== ''}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
