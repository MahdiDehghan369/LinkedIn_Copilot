import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Sparkles, Check, X } from 'lucide-react';
import { useIdeas, useUpdateIdeaStatus } from '../hooks/useContent.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/errorMessage.js';

const TABS = [
  { id: 'proposed', label: 'Proposed' },
  { id: 'used', label: 'Used' },
  { id: 'dismissed', label: 'Dismissed' },
];

export function IdeasPage() {
  const [tab, setTab] = useState('proposed');
  const { data: ideas = [], isLoading } = useIdeas({ status: tab });
  const updateStatus = useUpdateIdeaStatus();
  const toast = useToast();

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(status === 'used' ? 'Marked as used.' : 'Idea dismissed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title="Ideas"
        subtitle="Content ideas you've saved for later."
        actions={
          <Link to="/assistant">
            <Button>
              <Sparkles className="h-4 w-4" /> Generate ideas
            </Button>
          </Link>
        }
      />

      <div className="mb-6">
        <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />
      </div>

      {isLoading ? (
        <Card>
          <SkeletonLines count={4} />
        </Card>
      ) : ideas.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <Card key={idea._id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-(--color-accent)">
                  {idea.contentType || 'Idea'}
                </p>
                <StatusBadge status={idea.status} />
              </div>
              <p className="font-medium text-(--color-ink)">{idea.title}</p>
              {idea.hook && <p className="mt-1 text-sm text-(--color-ink-soft)">{idea.hook}</p>}
              {idea.audience && <p className="mt-2 text-xs text-(--color-ink-faint)">{idea.audience}</p>}
              {idea.suggestedHashtags?.length > 0 && (
                <p className="mt-2 text-xs text-(--color-accent)">
                  {idea.suggestedHashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                </p>
              )}
              {tab === 'proposed' && (
                <div className="mt-3 flex gap-2 border-t border-(--color-line) pt-3">
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(idea._id, 'used')}>
                    <Check className="h-3.5 w-3.5" /> Mark used
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(idea._id, 'dismissed')}>
                    <X className="h-3.5 w-3.5" /> Dismiss
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title={`No ${tab} ideas`}
          description={tab === 'proposed' ? 'Generate a batch of ideas from the AI Assistant.' : `Ideas you mark as ${tab} will show up here.`}
          action={
            tab === 'proposed' && (
              <Link to="/assistant">
                <Button size="sm">Generate ideas</Button>
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
