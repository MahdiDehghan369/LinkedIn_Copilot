import { Link } from 'react-router-dom';
import { FileText, PenLine, Clock, CheckCircle2, Sparkles, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePosts } from '../hooks/usePosts.js';
import { useAnalyticsOverview } from '../hooks/useAnalytics.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useLinkedInStatus } from '../hooks/useLinkedIn.js';
import { useContentGaps } from '../hooks/useContent.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Card } from '../components/ui/Card.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { NotificationItem } from '../components/notifications/NotificationItem.jsx';

export function DashboardPage() {
  const { user } = useAuth();

  const allPosts = usePosts({ pageSize: 1 });
  const draftPosts = usePosts({ status: 'DRAFT', pageSize: 1 });
  const scheduledPosts = usePosts({ status: 'SCHEDULED', pageSize: 1 });
  const publishedPosts = usePosts({ status: 'PUBLISHED', pageSize: 1 });
  const recentPosts = usePosts({ pageSize: 5 });
  const analytics = useAnalyticsOverview();
  const notifications = useNotifications({ unread: true });
  const linkedin = useLinkedInStatus();
  const gaps = useContentGaps();

  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Here's what's happening with your content."
        actions={
          <Link to="/assistant">
            <Button>
              <Sparkles className="h-4 w-4" /> Generate content
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total posts" value={allPosts.data?.total ?? '—'} icon={FileText} />
        <StatCard label="Drafts" value={draftPosts.data?.total ?? '—'} icon={PenLine} />
        <StatCard label="Scheduled" value={scheduledPosts.data?.total ?? '—'} icon={Clock} />
        <StatCard label="Published" value={publishedPosts.data?.total ?? '—'} icon={CheckCircle2} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-(--color-ink)">Recent posts</h2>
            <Link to="/posts" className="text-sm font-medium text-(--color-accent) hover:underline">
              View all
            </Link>
          </div>
          {recentPosts.isLoading ? (
            <SkeletonLines count={4} />
          ) : recentPosts.data?.posts?.length ? (
            <ul className="divide-y divide-(--color-line)">
              {recentPosts.data.posts.map((post) => (
                <li key={post._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <Link to={`/posts/${post._id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-ink)">
                      {post.content?.hook || 'Untitled draft'}
                    </p>
                    <p className="mt-0.5 text-xs text-(--color-ink-faint)">
                      Updated {new Date(post.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <StatusBadge status={post.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              description="Start with an AI-generated idea or a blank draft."
              action={
                <Link to="/posts">
                  <Button size="sm">Create a post</Button>
                </Link>
              }
            />
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-display text-base font-semibold text-(--color-ink)">LinkedIn</h2>
            {linkedin.isLoading ? (
              <SkeletonLines count={2} />
            ) : linkedin.data?.connected ? (
              <div>
                <StatusBadge status="connected" label="Connected" />
                {linkedin.data.connectedAt && (
                  <p className="mt-2 text-xs text-(--color-ink-faint)">
                    Since {new Date(linkedin.data.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-(--color-ink-soft)">Not connected yet.</p>
                <Link to="/linkedin" className="mt-3 inline-block">
                  <Button size="sm">Connect LinkedIn</Button>
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-base font-semibold text-(--color-ink)">Analytics overview</h2>
            {analytics.isLoading ? (
              <SkeletonLines count={3} />
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-(--color-ink-soft)">Total impressions</dt>
                  <dd className="font-medium text-(--color-ink)">{analytics.data?.totalImpressions ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-(--color-ink-soft)">Avg. engagement rate</dt>
                  <dd className="font-medium text-(--color-ink)">
                    {analytics.data?.averageEngagementRate != null
                      ? `${(analytics.data.averageEngagementRate * 100).toFixed(1)}%`
                      : '—'}
                  </dd>
                </div>
              </dl>
            )}
            <Link to="/analytics" className="mt-3 inline-block text-sm font-medium text-(--color-accent) hover:underline">
              View analytics
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-(--color-ink)">Recent notifications</h2>
            <Link to="/notifications" className="text-sm font-medium text-(--color-accent) hover:underline">
              View all
            </Link>
          </div>
          {notifications.isLoading ? (
            <SkeletonLines count={2} />
          ) : notifications.data?.length ? (
            <ul className="divide-y divide-(--color-line)">
              {notifications.data.slice(0, 4).map((notification) => (
                <NotificationItem key={notification._id} notification={notification} compact />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-(--color-ink-soft)">You're all caught up.</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-(--color-ink)">Content gaps</h2>
            <Link to="/ideas" className="text-sm font-medium text-(--color-accent) hover:underline">
              Get ideas
            </Link>
          </div>
          {gaps.isLoading ? (
            <SkeletonLines count={3} />
          ) : gaps.data?.length ? (
            <ul className="space-y-2">
              {gaps.data.slice(0, 5).map((gap) => (
                <li key={gap.topic} className="flex items-center justify-between text-sm">
                  <span className="text-(--color-ink)">{gap.topic}</span>
                  <span className="text-xs text-(--color-ink-faint)">
                    {gap.count} post{gap.count === 1 ? '' : 's'} · {gap.level}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Lightbulb} title="No topic data yet" description="Publish a few posts to see your coverage." />
          )}
        </Card>
      </div>
    </div>
  );
}
