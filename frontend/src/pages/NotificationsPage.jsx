import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { NotificationItem } from '../components/notifications/NotificationItem.jsx';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

export function NotificationsPage() {
  const [tab, setTab] = useState('all');
  const { data: notifications = [], isLoading } = useNotifications(tab === 'unread' ? { unread: true } : undefined);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Updates about your posts and LinkedIn connection." />

      <Card>
        <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />
        <div className="mt-2">
          {isLoading ? (
            <div className="py-4">
              <SkeletonLines count={5} />
            </div>
          ) : notifications.length ? (
            <ul className="divide-y divide-(--color-line)">
              {notifications.map((notification) => (
                <li key={notification._id}>
                  <NotificationItem notification={notification} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6">
              <EmptyState
                icon={Bell}
                title={tab === 'unread' ? "You're all caught up" : 'No notifications yet'}
                description="You'll see updates here when a post publishes, fails, or your LinkedIn connection needs attention."
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
