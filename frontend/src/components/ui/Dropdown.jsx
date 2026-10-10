import { useEffect, useRef, useState } from 'react';

/**
 * @param {{
 *   trigger: import('react').ReactNode,
 *   children: (close: () => void) => import('react').ReactNode,
 *   align?: 'left' | 'right',
 * }} props
 */
export function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute top-full z-40 mt-2 min-w-[180px] rounded-lg border border-(--color-line) bg-(--color-paper-raised) py-1.5 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{ onClick: () => void, children: import('react').ReactNode, danger?: boolean }} props
 */
export function DropdownItem({ onClick, children, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3.5 py-2 text-left text-sm transition-colors hover:bg-(--color-paper) ${
        danger ? 'text-(--color-critical)' : 'text-(--color-ink)'
      }`}
    >
      {children}
    </button>
  );
}
