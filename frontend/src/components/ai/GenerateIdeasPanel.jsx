import { useState } from 'react';
import { Sparkles, Bookmark, Lightbulb } from 'lucide-react';
import { useGenerateIdeas } from '../../hooks/useAI.js';
import { useSaveIdea } from '../../hooks/useContent.js';
import { TextField } from '../ui/TextField.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../lib/errorMessage.js';

export function GenerateIdeasPanel() {
  const toast = useToast();
  const generateIdeas = useGenerateIdeas();
  const saveIdea = useSaveIdea();
  const [topicHint, setTopicHint] = useState('');
  const [savedTitles, setSavedTitles] = useState(new Set());

  const handleGenerate = async () => {
    try {
      await generateIdeas.mutateAsync({ topicHint: topicHint || undefined, count: 5 });
      setSavedTitles(new Set());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSave = async (idea) => {
    try {
      await saveIdea.mutateAsync(idea);
      setSavedTitles((prev) => new Set(prev).add(idea.title));
      toast.success('Idea saved.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const ideas = generateIdeas.data?.ideas ?? [];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              id="topicHint"
              label="Topic (optional)"
              value={topicHint}
              onChange={setTopicHint}
              placeholder="e.g. Redis, career growth, system design"
            />
          </div>
          <Button onClick={handleGenerate} loading={generateIdeas.isPending}>
            <Sparkles className="h-4 w-4" /> Generate ideas
          </Button>
        </div>
      </Card>

      {generateIdeas.isPending ? (
        <p className="text-sm text-(--color-ink-faint)">Brainstorming ideas…</p>
      ) : ideas.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ideas.map((idea) => {
            const isSaved = savedTitles.has(idea.title);
            return (
              <Card key={idea.title}>
                <p className="text-xs font-medium uppercase tracking-wide text-(--color-accent)">{idea.contentType}</p>
                <p className="mt-1.5 font-medium text-(--color-ink)">{idea.title}</p>
                <p className="mt-1 text-sm text-(--color-ink-soft)">{idea.hook}</p>
                <p className="mt-2 text-xs text-(--color-ink-faint)">{idea.audience}</p>
                {idea.suggestedHashtags?.length > 0 && (
                  <p className="mt-2 text-xs text-(--color-accent)">
                    {idea.suggestedHashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </p>
                )}
                <Button
                  size="sm"
                  variant={isSaved ? 'secondary' : 'primary'}
                  className="mt-3"
                  disabled={isSaved}
                  onClick={() => handleSave(idea)}
                  loading={saveIdea.isPending}
                >
                  <Bookmark className="h-3.5 w-3.5" /> {isSaved ? 'Saved' : 'Save idea'}
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Lightbulb} title="No ideas yet" description="Generate a batch of ideas to get started." />
      )}
    </div>
  );
}
