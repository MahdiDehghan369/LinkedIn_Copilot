import { useLayoutEffect, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List } from 'lucide-react';
import {
  toBold,
  toItalic,
  toUnderline,
  toStrikethrough,
  applyToSelection,
  toggleBulletList,
} from '../../lib/textFormatting.js';

const TOOLBAR_BUTTONS = [
  { key: 'bold', icon: Bold, label: 'Bold', transform: toBold },
  { key: 'italic', icon: Italic, label: 'Italic', transform: toItalic },
  { key: 'underline', icon: Underline, label: 'Underline', transform: toUnderline },
  { key: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', transform: toStrikethrough },
];

/**
 * @param {{
 *   id: string,
 *   label?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   rows?: number,
 *   helperText?: string,
 * }} props
 */
export function FormattableTextarea({ id, label, value, onChange, placeholder, rows = 8, helperText }) {
  const textareaRef = useRef(null);
  const pendingSelection = useRef(null);

  // Restore the selection after a formatting click replaces `value` —
  // React re-renders the textarea's content, which otherwise drops the
  // cursor to the end.
  useLayoutEffect(() => {
    const pending = pendingSelection.current;
    if (pending && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pending.start, pending.end);
      pendingSelection.current = null;
    }
  }, [value]);

  const withCurrentSelection = (compute) => {
    const el = textareaRef.current;
    if (!el) return;
    const result = compute(el.selectionStart, el.selectionEnd);
    pendingSelection.current = { start: result.selectionStart, end: result.selectionEnd };
    onChange(result.text);
  };

  const applyTransform = (transform) => {
    withCurrentSelection((start, end) => applyToSelection(value, start, end, transform));
  };

  const applyBulletList = () => {
    withCurrentSelection((start, end) => toggleBulletList(value, start, end));
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-(--color-ink)">
          {label}
        </label>
      )}
      <div className="overflow-hidden rounded-lg border border-(--color-line) focus-within:border-(--color-accent)">
        <div className="flex items-center gap-0.5 border-b border-(--color-line) bg-(--color-paper) px-2 py-1.5">
          {TOOLBAR_BUTTONS.map((button) => (
            <button
              key={button.key}
              type="button"
              title={button.label}
              aria-label={button.label}
              // Prevents the button from stealing focus before onClick
              // fires — without this, the textarea's selection is lost
              // by the time the transform runs.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTransform(button.transform)}
              className="rounded p-1.5 text-(--color-ink-soft) transition-colors hover:bg-(--color-line)/60 hover:text-(--color-ink)"
            >
              <button.icon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-(--color-line)" aria-hidden="true" />
          <button
            type="button"
            title="Bullet list"
            aria-label="Bullet list"
            onMouseDown={(event) => event.preventDefault()}
            onClick={applyBulletList}
            className="rounded p-1.5 text-(--color-ink-soft) transition-colors hover:bg-(--color-line)/60 hover:text-(--color-ink)"
          >
            <List className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y bg-(--color-paper-raised) px-3.5 py-2.5 text-sm leading-relaxed text-(--color-ink) outline-none placeholder:text-(--color-ink-faint)"
        />
      </div>
      {helperText && <p className="mt-1.5 text-xs text-(--color-ink-faint)">{helperText}</p>}
    </div>
  );
}