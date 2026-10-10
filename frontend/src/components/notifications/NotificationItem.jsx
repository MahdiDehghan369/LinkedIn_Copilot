import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Link2, Bell } from 'lucide-react';
import { useMarkNotificationRead } from '../../hooks/useNotifications.js';

const TYPE_ICON = {
  'post.published': CheckCircle2,
  'post.publish_failed': XCircle,
  'linkedin.expired': Link2,
};

const TYPE_COLOR = {
  'post.published': 'text-(--color-positive)',
  'post.publish_failed': 'text-(--color-critical)',
  'linkedin.expired': 'text-amber-600',
};

/**
 * @param {{ notification: object, compact?: boolean }} props
 */
export function NotificationItem({ notification, compact = false }) {
  const markRead = useMarkNotificationRead();
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const iconColor = TYPE_COLOR[notification.type] ?? 'text-(--color-ink-faint)';

  const relatedHref =
    notification.relatedEntity?.type === 'Post' ? `/posts/${notification.relatedEntity.id}` : null;

  const content = (
    <div className={`flex items-start gap-3 ${compact ? 'py-2.5' : 'py-4'}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${notification.read ? 'text-(--color-ink-soft)' : 'font-medium text-(--color-ink)'}`}>
          {notification.message}
        </p>
        <p className="mt-0.5 text-xs text-(--color-ink-faint)">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
      {!notification.read && !compact && (
        <button
          type="button"
          onClick={() => markRead.mutate(notification._id)}
          disabled={markRead.isPending}
          className="shrink-0 text-xs font-medium text-(--color-accent) hover:underline disabled:opacity-50"
        >
          Mark read
        </button>
      )}
      {!notification.read && compact && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)" />}
    </div>
  );

  return relatedHref ? (
    <Link to={relatedHref} className="block hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}
