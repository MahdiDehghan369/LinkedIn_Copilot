import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import { useAnalyticsOverview, usePostAnalytics, useRefreshPostAnalytics, usePerformanceInsight } from '../hooks/useAnalytics.js';
import { usePosts } from '../hooks/usePosts.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { EngagementChart } from '../components/analytics/EngagementChart.jsx';
import { ScoreBars } from '../components/ai/ScoreBars.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/errorMessage.js';

export function AnalyticsPage() {
  const toast = useToast();
  const overview = useAnalyticsOverview();
  const publishedPosts = usePosts({ status: 'PUBLISHED', pageSize: 50 });
  const [selectedPostId, setSelectedPostId] = useState('');

  const postAnalytics = usePostAnalytics(selectedPostId);
  const refresh = useRefreshPostAnalytics();
  const insight = usePerformanceInsight();

  const posts = publishedPosts.data?.posts ?? [];
  const postOptions = posts.map((post) => ({
    value: post._id,
    label: post.content?.hook || `Post ${post._id.slice(-6)}`,
  }));

  const handleRefresh = async () => {
    try {
      await refresh.mutateAsync(selectedPostId);
      toast.success('Analytics refreshed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleInsight = async () => {
    try {
      await insight.mutateAsync(selectedPostId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="How your published posts are performing on LinkedIn." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Posts tracked" value={overview.isLoading ? '—' : overview.data?.totalPosts ?? 0} />
        <StatCard label="Total impressions" value={overview.isLoading ? '—' : overview.data?.totalImpressions ?? 0} />
        <StatCard
          label="Avg. engagement rate"
          value={
            overview.isLoading
              ? '—'
              : overview.data?.averageEngagementRate != null
                ? `${(overview.data.averageEngagementRate * 100).toFixed(1)}%`
                : '—'
          }
        />
        <StatCard
          label="Best performer"
          value={
            overview.isLoading ? (
              '—'
            ) : overview.data?.bestPerformingPost ? (
              <Link to={`/posts/${overview.data.bestPerformingPost.postId}`} className="text-base text-(--color-accent) hover:underline">
                {(overview.data.bestPerformingPost.engagementRate * 100).toFixed(1)}%
              </Link>
            ) : (
              '—'
            )
          }
        />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Select
              id="post-select"
              label="View analytics for"
              value={selectedPostId}
              onChange={setSelectedPostId}
              placeholder={posts.length ? 'Choose a published post' : 'No published posts yet'}
              options={postOptions}
            />
          </div>
          {selectedPostId && (
            <>
              <Button variant="secondary" onClick={handleRefresh} loading={refresh.isPending}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
              <Button onClick={handleInsight} loading={insight.isPending}>
                <Sparkles className="h-4 w-4" /> AI insight
              </Button>
            </>
          )}
        </div>

        {!selectedPostId ? (
          <EmptyState
            icon={BarChart3}
            title="Select a post"
            description={posts.length ? 'Choose a published post above to see its analytics.' : 'Publish a post to LinkedIn to start tracking analytics.'}
          />
        ) : postAnalytics.isLoading ? (
          <SkeletonLines count={4} />
        ) : postAnalytics.data ? (
          <div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricStat label="Impressions" value={postAnalytics.data.impressions} />
              <MetricStat label="Reactions" value={postAnalytics.data.reactions} />
              <MetricStat label="Comments" value={postAnalytics.data.comments} />
              <MetricStat label="Reposts" value={postAnalytics.data.reposts} />
            </div>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-(--color-ink-soft)">Engagement rate over time</p>
              <EngagementChart history={postAnalytics.data.history ?? []} />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No analytics recorded yet"
            description="Refresh to pull the latest engagement data from LinkedIn."
            action={
              <Button size="sm" onClick={handleRefresh} loading={refresh.isPending}>
                Refresh now
              </Button>
            }
          />
        )}
      </Card>

      {insight.data && (
        <Card className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-(--color-ink)">AI performance insight</h2>
            <span className="text-sm text-(--color-ink-soft)">
              {insight.data.performance.deltaPercent >= 0 ? '+' : ''}
              {insight.data.performance.deltaPercent}% vs. your average
            </span>
          </div>
          <ScoreBars scores={insight.data.insight.scores} />
          {insight.data.insight.suggestions?.length > 0 && (
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-(--color-ink-soft)">
              {insight.data.insight.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function MetricStat({ label, value }) {
  return (
    <div className="rounded-lg bg-(--color-paper) px-3.5 py-3">
      <p className="text-xs text-(--color-ink-faint)">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-(--color-ink)">{value ?? '—'}</p>
    </div>
  );
}
