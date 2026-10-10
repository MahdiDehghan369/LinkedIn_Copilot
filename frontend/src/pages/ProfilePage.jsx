import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUpdateProfile } from '../hooks/useUsers.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/errorMessage.js';

const EMOJI_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
];

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" subtitle="Your account and content preferences." />
      {/* Keyed by user id so the form's local state initializes fresh if the underlying profile changes. */}
      <ProfileForm key={user?.id} user={user} />
    </div>
  );
}

/** @param {{ user: import('../api/usersApi.js').UserProfile }} props */
function ProfileForm({ user }) {
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? '');
  const [language, setLanguage] = useState(user?.preferences?.language ?? '');
  const [tone, setTone] = useState(user?.preferences?.tone ?? '');
  const [audience, setAudience] = useState(user?.preferences?.audience ?? '');
  const [postingFrequency, setPostingFrequency] = useState(user?.preferences?.postingFrequency ?? '');
  const [emojiUsage, setEmojiUsage] = useState(user?.preferences?.emojiUsage ?? 'minimal');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync({
        name,
        preferences: { language, tone, audience, postingFrequency, emojiUsage },
      });
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField id="name" label="Full name" value={name} onChange={setName} />
        <TextField id="email" label="Email" value={user?.email ?? ''} onChange={() => {}} disabled />
        <p className="-mt-3 text-xs text-(--color-ink-faint)">Email can't be changed here.</p>

        <div className="border-t border-(--color-line) pt-4">
          <h2 className="mb-3 text-sm font-medium text-(--color-ink)">Content preferences</h2>
          <div className="space-y-4">
            <TextField id="language" label="Language" value={language} onChange={setLanguage} placeholder="English" />
            <TextField id="tone" label="Tone" value={tone} onChange={setTone} placeholder="Technical, conversational, direct…" />
            <TextField id="audience" label="Target audience" value={audience} onChange={setAudience} placeholder="Backend developers" />
            <TextField
              id="postingFrequency"
              label="Posting frequency"
              value={postingFrequency}
              onChange={setPostingFrequency}
              placeholder="3 posts/week"
            />
            <Select id="emojiUsage" label="Emoji usage" value={emojiUsage} onChange={setEmojiUsage} options={EMOJI_OPTIONS} />
          </div>
        </div>

        <Button type="submit" loading={updateProfile.isPending}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
