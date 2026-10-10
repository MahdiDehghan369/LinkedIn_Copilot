import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { usePosts, useApprovePost, usePublishPost, useSchedulePost, useCancelPost, useDeletePost } from '../hooks/usePosts.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { PostCard } from '../components/posts/PostCard.jsx';
import { ScheduleDialog } from '../components/posts/ScheduleDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/errorMessage.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'GENERATED', label: 'Generated' },
  { value: 'EDITED', label: 'Edited' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PUBLISHING', label: 'Publishing' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

export function PostsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = usePosts({ status: status || undefined, page, pageSize: PAGE_SIZE });
  const approve = useApprovePost();
  const publish = usePublishPost();
  const schedule = useSchedulePost();
  const cancel = useCancelPost();
  const remove = useDeletePost();

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const runAction = async (mutation, variables, successMessage) => {
    try {
      await mutation.mutateAsync(variables);
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title="Posts"
        subtitle="Manage every draft, scheduled, and published post."
        actions={
          <Button onClick={() => navigate('/posts/new')}>
            <Plus className="h-4 w-4" /> New post
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          id="status-filter"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      <Card>
        {isLoading ? (
          <SkeletonLines count={5} />
        ) : posts.length ? (
          <div>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                busy={approve.isPending || publish.isPending || schedule.isPending || cancel.isPending || remove.isPending}
                onApprove={() => runAction(approve, post._id, 'Post approved.')}
                onPublish={() => runAction(publish, post._id, 'Publishing started.')}
                onSchedule={() => setScheduleTarget(post)}
                onCancel={() => setCancelTarget(post)}
                onDelete={() => setDeleteTarget(post)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No posts here yet"
            description="Create a draft manually, or head to the AI Assistant to generate one."
            action={
              <Button size="sm" onClick={() => navigate('/posts/new')}>
                Create a post
              </Button>
            }
          />
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-(--color-ink-soft)">
            Page {page} of {totalPages} · {total} posts
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ScheduleDialog
        open={Boolean(scheduleTarget)}
        onClose={() => setScheduleTarget(null)}
        loading={schedule.isPending}
        onConfirm={async (scheduledFor) => {
          try {
            await schedule.mutateAsync({ id: scheduleTarget._id, scheduledFor });
            toast.success('Post scheduled.');
            setScheduleTarget(null);
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this post?"
        description="This post will move to Cancelled and can no longer be published or scheduled."
        confirmLabel="Cancel post"
        loading={cancel.isPending}
        onConfirm={async () => {
          await runAction(cancel, cancelTarget._id, 'Post cancelled.');
          setCancelTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this post?"
        description="This permanently removes the draft. This can't be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={async () => {
          await runAction(remove, deleteTarget._id, 'Post deleted.');
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
