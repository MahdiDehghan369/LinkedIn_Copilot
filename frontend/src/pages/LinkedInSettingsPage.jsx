import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLinkedInStatus, useDisconnectLinkedIn } from '../hooks/useLinkedIn.js';
import { getLinkedInConnectUrl } from '../api/linkedinApi.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CALLBACK_BANNERS = {
  connected: { icon: CheckCircle2, tone: 'positive', message: 'LinkedIn connected successfully.' },
  denied: { icon: AlertCircle, tone: 'critical', message: 'LinkedIn connection was cancelled.' },
  error: { icon: AlertCircle, tone: 'critical', message: 'Something went wrong connecting to LinkedIn. Please try again.' },
};

export function LinkedInSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useLinkedInStatus();
  const disconnect = useDisconnectLinkedIn();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const callbackFlag = searchParams.get('linkedin');
  const banner = callbackFlag ? CALLBACK_BANNERS[callbackFlag] : null;

  const dismissBanner = () => {
    searchParams.delete('linkedin');
    setSearchParams(searchParams, { replace: true });
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast.success('LinkedIn disconnected.');
      setConfirmOpen(false);
    } catch {
      toast.error('Could not disconnect LinkedIn. Please try again.');
    }
  };

  const connected = Boolean(data?.connected);
  const status = data?.status;

  return (
    <div className="max-w-xl">
      <PageHeader title="LinkedIn" subtitle="Manage your LinkedIn connection." />

      {banner && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            banner.tone === 'positive'
              ? 'border-(--color-positive)/30 bg-(--color-positive-soft) text-(--color-positive)'
              : 'border-(--color-critical)/30 bg-(--color-critical-soft) text-(--color-critical)'
          }`}
        >
          <span className="flex items-center gap-2">
            <banner.icon className="h-4 w-4" /> {banner.message}
          </span>
          <button type="button" onClick={dismissBanner} className="text-xs font-medium opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10">
            <Link2 className="h-5 w-5 text-[#0A66C2]" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-(--color-ink)">LinkedIn account</p>
            {isLoading ? (
              <div className="mt-1.5 w-32">
                <SkeletonLines count={1} />
              </div>
            ) : connected ? (
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={status ?? 'connected'} label="Connected" />
                {data?.connectedAt && (
                  <span className="text-xs text-(--color-ink-faint)">
                    since {new Date(data.connectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-(--color-ink-soft)">Not connected</p>
            )}
          </div>
        </div>

        {status === 'expired' && (
          <p className="mt-4 rounded-lg bg-(--color-critical-soft) px-3.5 py-2.5 text-sm text-(--color-critical)">
            Your LinkedIn connection has expired. Reconnect to keep publishing.
          </p>
        )}

        <div className="mt-6">
          {connected ? (
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Disconnect LinkedIn
            </Button>
          ) : (
            <a href={getLinkedInConnectUrl()}>
              <Button>Connect LinkedIn</Button>
            </a>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDisconnect}
        title="Disconnect LinkedIn?"
        description="You won't be able to publish or refresh analytics until you reconnect."
        confirmLabel="Disconnect"
        loading={disconnect.isPending}
      />
    </div>
  );
}
