import { Link } from 'react-router-dom';
import { Send, CalendarClock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { Button } from '../ui/Button.jsx';

const APPROVABLE = new Set(['GENERATED', 'EDITED', 'FAILED']);
const PUBLISHABLE_OR_SCHEDULABLE = new Set(['APPROVED']);
const CANCELLABLE = new Set(['DRAFT', 'GENERATED', 'EDITED', 'APPROVED', 'SCHEDULED']);
const DELETABLE = new Set(['DRAFT', 'CANCELLED', 'FAILED']);

/**
 * @param {{
 *   post: object,
 *   onApprove: () => void,
 *   onPublish: () => void,
 *   onSchedule: () => void,
 *   onCancel: () => void,
 *   onDelete: () => void,
 *   busy?: boolean,
 * }} props
 */
export function PostCard({ post, onApprove, onPublish, onSchedule, onCancel, onDelete, busy = false }) {
  const status = post.status;

  return (
    <div className="flex flex-col gap-3 border-b border-(--color-line) py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <Link to={`/posts/${post._id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {post.scheduledFor && status === 'SCHEDULED' && (
            <span className="text-xs text-(--color-ink-faint)">
              for {new Date(post.scheduledFor).toLocaleString()}
            </span>
          )}
        </div>
        <p className="mt-1.5 truncate text-sm font-medium text-(--color-ink)">
          {post.content?.hook || 'Untitled draft'}
        </p>
        <p className="mt-0.5 truncate text-xs text-(--color-ink-faint)">
          {post.content?.body || 'No content yet'}
        </p>
        {status === 'FAILED' && post.linkedin?.lastError && (
          <p className="mt-1 text-xs text-(--color-critical)">{post.linkedin.lastError}</p>
        )}
      </Link>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {APPROVABLE.has(status) && (
          <Button size="sm" variant="secondary" onClick={onApprove} disabled={busy}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </Button>
        )}
        {PUBLISHABLE_OR_SCHEDULABLE.has(status) && (
          <>
            <Button size="sm" variant="secondary" onClick={onSchedule} disabled={busy}>
              <CalendarClock className="h-3.5 w-3.5" /> Schedule
            </Button>
            <Button size="sm" onClick={onPublish} disabled={busy}>
              <Send className="h-3.5 w-3.5" /> Publish
            </Button>
          </>
        )}
        {CANCELLABLE.has(status) && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </Button>
        )}
        {DELETABLE.has(status) && (
          <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
