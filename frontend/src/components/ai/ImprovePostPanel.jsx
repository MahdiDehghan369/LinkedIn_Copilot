import { useState } from 'react';
import { Sparkles, Copy } from 'lucide-react';
import { useImprovePost } from '../../hooks/useAI.js';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ScoreBars } from './ScoreBars.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../lib/errorMessage.js';

export function ImprovePostPanel() {
  const toast = useToast();
  const improve = useImprovePost();
  const [content, setContent] = useState('');

  const handleImprove = async () => {
    if (!content.trim()) {
      toast.error('Paste some post content first.');
      return;
    }
    try {
      await improve.mutateAsync({ content });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCopy = async () => {
    const improved = improve.data?.improved;
    if (!improved) return;
    const text = [improved.hook, improved.body, improved.cta].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard.');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <Textarea
          id="improveContent"
          label="Paste your post"
          rows={10}
          value={content}
          onChange={setContent}
          placeholder="Paste an existing LinkedIn post draft here..."
        />
        <Button className="mt-4" onClick={handleImprove} loading={improve.isPending}>
          <Sparkles className="h-4 w-4" /> Score &amp; improve
        </Button>
      </Card>

      <Card>
        {improve.isPending ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-(--color-ink-faint)">
            Analyzing your post…
          </div>
        ) : improve.data ? (
          <div>
            <ScoreBars scores={improve.data.scores} />
            <div className="mt-4 rounded-lg border border-(--color-line) bg-(--color-paper) p-3.5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--color-ink-faint)">
                Suggested rewrite
              </p>
              <p className="whitespace-pre-wrap text-sm text-(--color-ink)">
                {[improve.data.improved.hook, improve.data.improved.body, improve.data.improved.cta]
                  .filter(Boolean)
                  .join('\n\n')}
              </p>
            </div>
            <Button size="sm" variant="secondary" className="mt-3" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" /> Copy rewrite
            </Button>
          </div>
        ) : (
          <EmptyState icon={Sparkles} title="No analysis yet" description="Paste a post and score it to see feedback here." />
        )}
      </Card>
    </div>
  );
}
