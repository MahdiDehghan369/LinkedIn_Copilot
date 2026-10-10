import { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * @param {{ open: boolean, onClose: () => void, onConfirm: (isoString: string) => void, loading?: boolean }} props
 */
export function ScheduleDialog({ open, onClose, onConfirm, loading = false }) {
  const [value, setValue] = useState('');
  const [minLocal] = useState(() => toLocalInputValue(new Date(Date.now() + 5 * 60_000)));

  const handleConfirm = () => {
    if (!value) return;
    onConfirm(new Date(value).toISOString());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule this post"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!value} loading={loading}>
            Schedule
          </Button>
        </>
      }
    >
      <label htmlFor="scheduledFor" className="mb-1.5 block text-sm font-medium text-(--color-ink)">
        Date &amp; time
      </label>
      <input
        id="scheduledFor"
        type="datetime-local"
        min={minLocal}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-lg border border-(--color-line) bg-(--color-paper-raised) px-3.5 py-2.5 text-sm text-(--color-ink) outline-none focus:border-(--color-accent)"
      />
      <p className="mt-1.5 text-xs text-(--color-ink-faint)">Must be in the future.</p>
    </Modal>
  );
}

/** @param {Date} date */
function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
