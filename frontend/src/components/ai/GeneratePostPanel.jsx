import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Copy, FileEdit } from 'lucide-react';
import { useGeneratePost } from '../../hooks/useAI.js';
import { useCreatePost } from '../../hooks/usePosts.js';
import { TextField } from '../ui/TextField.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../lib/errorMessage.js';

const LENGTH_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

export function GeneratePostPanel() {
  const toast = useToast();
  const navigate = useNavigate();
  const generatePost = useGeneratePost();
  const createPost = useCreatePost();

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [length, setLength] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic first.');
      return;
    }
    try {
      await generatePost.mutateAsync({
        topic,
        tone: tone || undefined,
        audience: audience || undefined,
        length: length || undefined,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCopy = async () => {
    const post = generatePost.data?.post;
    if (!post) return;
    const text = [post.hook, post.body, post.cta].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard.');
  };

  const handleSaveAsDraft = async () => {
    const post = generatePost.data?.post;
    if (!post) return;
    try {
      const result = await createPost.mutateAsync({ content: post });
      toast.success('Saved as draft.');
      navigate(`/posts/${result.post._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const post = generatePost.data?.post;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <div className="space-y-4">
          <TextField id="topic" label="Topic" value={topic} onChange={setTopic} placeholder="e.g. Redis Streams for event-driven systems" />
          <TextField id="tone" label="Tone (optional)" value={tone} onChange={setTone} placeholder="e.g. Technical, conversational" />
          <TextField id="audience" label="Audience (optional)" value={audience} onChange={setAudience} placeholder="e.g. Backend developers" />
          <Select id="length" label="Length" value={length} onChange={setLength} options={LENGTH_OPTIONS} />
          <Button onClick={handleGenerate} loading={generatePost.isPending} className="w-full">
            <Sparkles className="h-4 w-4" /> Generate post
          </Button>
        </div>
      </Card>

      <Card>
        {generatePost.isPending ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-(--color-ink-faint)">
            Writing your post…
          </div>
        ) : post ? (
          <div>
            <div className="space-y-3 whitespace-pre-wrap text-sm text-(--color-ink)">
              <p className="font-medium">{post.hook}</p>
              <p>{post.body}</p>
              <p className="text-(--color-ink-soft)">{post.cta}</p>
              {post.hashtags?.length > 0 && (
                <p className="text-(--color-accent)">{post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}</p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-(--color-line) pt-4">
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" onClick={handleSaveAsDraft} loading={createPost.isPending}>
                <FileEdit className="h-3.5 w-3.5" /> Save as draft
              </Button>
              <Button size="sm" variant="ghost" onClick={handleGenerate} loading={generatePost.isPending}>
                Generate again
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Nothing generated yet"
            description="Fill in a topic and generate a post to see it here."
          />
        )}
      </Card>
    </div>
  );
}
