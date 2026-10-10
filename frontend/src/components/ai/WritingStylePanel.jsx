import { useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { useAnalyzeWritingStyle } from '../../hooks/useAI.js';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../lib/errorMessage.js';

const PROFILE_LABELS = {
  tone: 'Tone',
  sentenceLength: 'Sentence length',
  technicalDepth: 'Technical depth',
  emojiUsage: 'Emoji usage',
  paragraphStyle: 'Paragraph style',
  hookStyle: 'Hook style',
  ctaStyle: 'CTA style',
};

export function WritingStylePanel() {
  const toast = useToast();
  const analyze = useAnalyzeWritingStyle();
  const [samples, setSamples] = useState(['']);

  const updateSample = (index, value) => {
    setSamples((current) => current.map((sample, i) => (i === index ? value : sample)));
  };

  const addSample = () => setSamples((current) => [...current, '']);
  const removeSample = (index) => setSamples((current) => current.filter((_, i) => i !== index));

  const handleAnalyze = async () => {
    const cleaned = samples.map((sample) => sample.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      toast.error('Add at least one sample post.');
      return;
    }
    try {
      await analyze.mutateAsync({ samplePosts: cleaned });
      toast.success('Writing style saved to your profile.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <p className="mb-4 text-sm text-(--color-ink-soft)">
          Paste a few of your past LinkedIn posts and Copilot will learn your writing style.
        </p>
        <div className="space-y-4">
          {samples.map((sample, index) => (
            <div key={index} className="relative">
              <Textarea
                id={`sample-${index}`}
                label={`Sample post ${index + 1}`}
                rows={4}
                value={sample}
                onChange={(value) => updateSample(index, value)}
                placeholder="Paste a past post here..."
              />
              {samples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSample(index)}
                  className="absolute right-0 top-0 text-(--color-ink-faint) hover:text-(--color-critical)"
                  aria-label="Remove sample"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={addSample} disabled={samples.length >= 20}>
            <Plus className="h-3.5 w-3.5" /> Add another
          </Button>
          <Button size="sm" onClick={handleAnalyze} loading={analyze.isPending}>
            <Sparkles className="h-3.5 w-3.5" /> Analyze style
          </Button>
        </div>
      </Card>

      <Card>
        {analyze.isPending ? (
          <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-(--color-ink-faint)">
            Analyzing your writing style…
          </div>
        ) : analyze.data?.profile ? (
          <dl className="space-y-3">
            {Object.entries(analyze.data.profile).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border-b border-(--color-line) pb-2.5 last:border-b-0">
                <dt className="text-sm text-(--color-ink-soft)">{PROFILE_LABELS[key] ?? key}</dt>
                <dd className="text-sm font-medium capitalize text-(--color-ink)">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No style profile yet"
            description="Analyze a few sample posts to build your writing style profile."
          />
        )}
      </Card>
    </div>
  );
}
