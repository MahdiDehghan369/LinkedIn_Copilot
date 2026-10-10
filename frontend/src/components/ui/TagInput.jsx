import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * @param {{ id: string, label: string, value: string[], onChange: (tags: string[]) => void, placeholder?: string }} props
 */
export function TagInput({ id, label, value, onChange, placeholder }) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const cleaned = draft.trim();
    if (cleaned && !value.includes(cleaned)) onChange([...value, cleaned]);
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-(--color-ink)">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-(--color-line) bg-(--color-paper-raised) px-2.5 py-2 focus-within:border-(--color-accent)">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-(--color-accent-soft) px-2 py-0.5 text-xs font-medium text-(--color-accent)"
          >
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[100px] flex-1 border-none bg-transparent text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-faint)"
        />
      </div>
    </div>
  );
}
