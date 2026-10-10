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

const CREATIVITY_OPTIONS = [
  { value: 'low', label: 'Low — precise and predictable' },
  { value: 'medium', label: 'Medium — balanced' },
  { value: 'high', label: 'High — more exploratory' },
];

export function AISettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-xl">
      <PageHeader title="AI Settings" subtitle="Preferences for how the AI generates content on your behalf." />
      <AISettingsForm key={user?.id} user={user} />
    </div>
  );
}

/** @param {{ user: import('../api/usersApi.js').UserProfile }} props */
function AISettingsForm({ user }) {
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const [model, setModel] = useState(user?.aiSettings?.model ?? '');
  const [creativity, setCreativity] = useState(user?.aiSettings?.creativity ?? 'medium');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync({ aiSettings: { model, creativity } });
      toast.success('AI settings updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField id="model" label="Model" value={model} onChange={setModel} placeholder="default" />
        <Select id="creativity" label="Creativity" value={creativity} onChange={setCreativity} options={CREATIVITY_OPTIONS} />
        <Button type="submit" loading={updateProfile.isPending}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
