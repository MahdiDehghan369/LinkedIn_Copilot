import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Send, CalendarClock, CheckCircle2, XCircle, Trash2, Copy } from 'lucide-react';
import { usePost, useCreatePost, useUpdatePost, useApprovePost, usePublishPost, useSchedulePost, useCancelPost, useDeletePost } from '../hooks/usePosts.js';
import { useImprovePost } from '../hooks/useAI.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { TagInput } from '../components/ui/TagInput.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { PageSpinner } from '../components/ui/PageSpinner.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ScheduleDialog } from '../components/posts/ScheduleDialog.jsx';
import { LinkedInPreview } from '../components/posts/LinkedInPreview.jsx';
import { ScoreBars } from '../components/ai/ScoreBars.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/errorMessage.js';
import {
  useUploadPostImage, useDeletePostImage,
} from '../hooks/usePosts.js';
import { getPostImageUrl } from '../api/postsApi.js';
import { FormattableTextarea } from '../components/ui/FormattableTextarea.jsx'; // replaces plain Textarea
import { ImageUploader } from '../components/posts/ImageUploader.jsx';

const EDITABLE_STATUSES = new Set(['DRAFT', 'GENERATED', 'EDITED']);
const APPROVABLE_STATUSES = new Set(['GENERATED', 'EDITED', 'FAILED']);
const DELETABLE_STATUSES = new Set(['DRAFT', 'CANCELLED', 'FAILED']);
const CANCELLABLE_STATUSES = new Set(['DRAFT', 'GENERATED', 'EDITED', 'APPROVED', 'SCHEDULED']);

export function PostEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();

  const { data: post, isLoading } = usePost(id);
  const approve = useApprovePost();
  const publish = usePublishPost();
  const schedule = useSchedulePost();
  const cancel = useCancelPost();
  const remove = useDeletePost();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!isNew && isLoading) return <PageSpinner />;

  const status = post?.status ?? 'DRAFT';

  const runAction = async (mutation, successMessage, onDone) => {
    try {
      await mutation.mutateAsync(id);
      toast.success(successMessage);
      onDone?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const busy = approve.isPending || publish.isPending || schedule.isPending || cancel.isPending || remove.isPending;

  return (
    <div>
      <PageHeader
        title={isNew ? 'New post' : 'Edit post'}
        subtitle={!isNew && <StatusBadge status={status} />}
        actions={
          <div className="flex flex-wrap gap-2">
            {!isNew && APPROVABLE_STATUSES.has(status) && (
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => runAction(approve, 'Post approved.')}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
            )}
            {!isNew && status === 'APPROVED' && (
              <>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => setScheduleOpen(true)}>
                  <CalendarClock className="h-3.5 w-3.5" /> Schedule
                </Button>
                <Button size="sm" disabled={busy} onClick={() => runAction(publish, 'Publishing started.')}>
                  <Send className="h-3.5 w-3.5" /> Publish
                </Button>
              </>
            )}
            {!isNew && CANCELLABLE_STATUSES.has(status) && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setCancelOpen(true)}>
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
            {!isNew && DELETABLE_STATUSES.has(status) && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        }
      />

      {/* Keyed by post id (or 'new'): initial form state derives directly
          from `post` at mount, so switching between posts or from
          create->edit-after-save remounts with fresh state instead of
          needing an effect to resync it. */}
      <PostEditorForm key={post?._id ?? 'new'} post={post} isNew={isNew} postId={id} status={status} />

      <ScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        loading={schedule.isPending}
        onConfirm={async (scheduledFor) => {
          try {
            await schedule.mutateAsync({ id, scheduledFor });
            toast.success('Post scheduled.');
            setScheduleOpen(false);
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this post?"
        description="This post will move to Cancelled and can no longer be published or scheduled."
        confirmLabel="Cancel post"
        loading={cancel.isPending}
        onConfirm={() => runAction(cancel, 'Post cancelled.', () => setCancelOpen(false))}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this post?"
        description="This permanently removes the draft. This can't be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(id);
            toast.success('Post deleted.');
            navigate('/posts');
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />
    </div>
  );
}

/**
 * @param {{ post: object|undefined, isNew: boolean, postId: string|undefined, status: string }} props
 */
function PostEditorForm({ post, isNew, postId, status }) {
  // Inside PostEditorForm:
  const uploadImage = useUploadPostImage();
  const removeImage = useDeletePostImage();

  const handleImageUpload = async (file) => {
    try {
      await uploadImage.mutateAsync({ id: postId, file });
      toast.success("Image added.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleImageRemove = async () => {
    try {
      await removeImage.mutateAsync(postId);
      toast.success("Image removed.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  const navigate = useNavigate();
  const toast = useToast();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const improve = useImprovePost();

  const [content, setContent] = useState({
    hook: post?.content?.hook ?? "",
    body: post?.content?.body ?? "",
    cta: post?.content?.cta ?? "",
  });
  const [hashtags, setHashtags] = useState(post?.content?.hashtags ?? []);
  const [topicTags, setTopicTags] = useState(post?.topicTags ?? []);
  const [improveResult, setImproveResult] = useState(null);

  const isEditable = isNew || EDITABLE_STATUSES.has(status);

  const handleSave = async () => {
    try {
      if (isNew) {
        const result = await createPost.mutateAsync({
          content: { ...content, hashtags },
          topicTags,
        });
        toast.success("Draft created.");
        navigate(`/posts/${result.post._id}`, { replace: true });
      } else {
        await updatePost.mutateAsync({
          id: postId,
          patch: { content: { ...content, hashtags }, topicTags },
        });
        toast.success("Changes saved.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleImprove = async () => {
    const text = [content.hook, content.body, content.cta]
      .filter(Boolean)
      .join("\n\n");
    if (!text.trim()) {
      toast.error("Write some content first.");
      return;
    }
    try {
      const result = await improve.mutateAsync({ content: text });
      setImproveResult(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const applyImprovedVersion = () => {
    if (!improveResult) return;
    setContent({
      hook: improveResult.improved.hook,
      body: improveResult.improved.body,
      cta: improveResult.improved.cta,
    });
    setHashtags(improveResult.improved.hashtags ?? []);
    setImproveResult(null);
    toast.success("Improved version applied — remember to save.");
  };

  const handleCopy = async () => {
    const text = [content.hook, content.body, content.cta]
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <div className="space-y-4">
          <TextField
            id="hook"
            label="Hook"
            value={content.hook}
            onChange={(value) => setContent((c) => ({ ...c, hook: value }))}
            placeholder="The first line people see — make it count."
          />
          {/* <Textarea
            id="body"
            label="Body"
            rows={8}
            value={content.body}
            onChange={(value) => setContent((c) => ({ ...c, body: value }))}
            placeholder="Write the main content of your post..."
            helperText={`${content.body.length} characters`}
          /> */}
          <FormattableTextarea
            id="body"
            label="Body"
            rows={8}
            value={content.body}
            onChange={(value) => setContent((c) => ({ ...c, body: value }))}
            placeholder="Write the main content of your post..."
            helperText={`${content.body.length} characters`}
          />
          <TextField
            id="cta"
            label="Call to action"
            value={content.cta}
            onChange={(value) => setContent((c) => ({ ...c, cta: value }))}
            placeholder="What do you want readers to do next?"
          />
          <TagInput
            id="hashtags"
            label="Hashtags"
            value={hashtags}
            onChange={setHashtags}
            placeholder="Add a hashtag and press Enter"
          />
          <TagInput
            id="topicTags"
            label="Topic tags"
            value={topicTags}
            onChange={setTopicTags}
            placeholder="Add a topic tag and press Enter"
          />
          {isNew ? (
            <p className="rounded-lg bg-(--color-line)/40 px-3.5 py-2.5 text-xs text-(--color-ink-soft)">
              Create the draft first, then you can attach an image.
            </p>
          ) : (
            <ImageUploader
              postId={postId}
              image={post?.image}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              uploading={uploadImage.isPending}
              removing={removeImage.isPending}
              disabled={!isEditable}
            />
          )}
          {!isEditable && (
            <p className="rounded-lg bg-(--color-line)/40 px-3.5 py-2.5 text-xs text-(--color-ink-soft)">
              This post can't be edited while it's {status.toLowerCase()}.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-(--color-line) pt-4">
            <Button
              onClick={handleSave}
              loading={createPost.isPending || updatePost.isPending}
              disabled={!isEditable}
            >
              {isNew ? "Create draft" : "Save changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleImprove}
              loading={improve.isPending}
              disabled={!isEditable}
            >
              <Sparkles className="h-4 w-4" /> Improve with AI
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-medium text-(--color-ink-soft)">
            Preview
          </h2>
          <LinkedInPreview
            content={{ ...content, hashtags }}
            imageUrl={post?.image ? getPostImageUrl(postId) : undefined}
          />
        </div>

        {improveResult && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-(--color-ink)">
                AI feedback
              </h2>
              <button
                type="button"
                onClick={() => setImproveResult(null)}
                className="text-xs font-medium text-(--color-ink-faint) hover:text-(--color-ink)"
              >
                Dismiss
              </button>
            </div>
            <ScoreBars scores={improveResult.scores} />
            <div className="mt-4 rounded-lg border border-(--color-line) bg-(--color-paper) p-3.5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--color-ink-faint)">
                Suggested rewrite
              </p>
              <p className="whitespace-pre-wrap text-sm text-(--color-ink)">
                {[
                  improveResult.improved.hook,
                  improveResult.improved.body,
                  improveResult.improved.cta,
                ]
                  .filter(Boolean)
                  .join("\n\n")}
              </p>
            </div>
            <Button size="sm" className="mt-3" onClick={applyImprovedVersion}>
              Apply this version
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
