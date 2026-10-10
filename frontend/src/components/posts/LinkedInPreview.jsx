import { ThumbsUp, MessageCircle, Repeat2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * @param {{ content: { hook?: string, body?: string, cta?: string, hashtags?: string[] } }} props
 */
export function LinkedInPreview({ content, imageUrl }) {
  const { user } = useAuth();
  const text = [content?.hook, content?.body, content?.cta]
    .filter(Boolean)
    .join("\n\n");
  const hashtagLine = content?.hashtags?.length
    ? content.hashtags
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .join(" ")
    : "";

  return (
    <div className="overflow-hidden rounded-xl border border-(--color-line) bg-(--color-paper-raised)">
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-sm font-semibold text-(--color-accent)">
          {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </span>
        <div>
          <p className="text-sm font-semibold text-(--color-ink)">
            {user?.name ?? "Your name"}
          </p>
          <p className="text-xs text-(--color-ink-faint)">Now · 🌐</p>
        </div>
      </div>

      {imageUrl && (
        <div className="border-t border-(--color-line)">
          <img src={imageUrl} alt="" className="max-h-80 w-full object-cover" />
        </div>
      )}

      <div className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed text-(--color-ink)">
        {text || (
          <span className="text-(--color-ink-faint)">
            Your post preview will appear here.
          </span>
        )}
        {hashtagLine && (
          <p className="mt-2 text-(--color-accent)">{hashtagLine}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-(--color-line) px-4 py-2.5 text-(--color-ink-faint)">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageCircle, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs font-medium"
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
