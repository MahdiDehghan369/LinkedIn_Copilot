import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { composePostText } from '../posts/publish-post.use-case.js';

/**
 * @param {{ impressions: number|null, reactions: number, comments: number, reposts: number }} counts
 * @returns {number|null}
 */
function computeEngagementRate({ impressions, reactions, comments, reposts }) {
  if (!impressions || impressions <= 0) return null;
  return Number(((reactions + comments + reposts) / impressions).toFixed(4));
}

export class AnalyticsService {
  /**
   * @param {import('./post-analytics.repository.js').PostAnalyticsRepository} postAnalyticsRepository
   * @param {import('../posts/posts.repository.js').PostRepository} postRepository
   * @param {import('../linkedin/linkedin.service.js').LinkedInService} linkedinService
   * @param {import('../ai/ai.service.js').AiService} aiService
   */
  constructor(postAnalyticsRepository, postRepository, linkedinService, aiService) {
    this.analytics = postAnalyticsRepository;
    this.posts = postRepository;
    this.linkedin = linkedinService;
    this.ai = aiService;
  }

  /**
   * Pulls fresh engagement counts from LinkedIn for one post and records
   * a snapshot. Only meaningful for a post that's actually been
   * published — architecture doc §31: "Collect supported LinkedIn
   * metrics" for real published content, not drafts.
   * @param {string} userId
   * @param {string} postId
   */
  async refreshPostAnalytics(userId, postId) {
    const post = await this.posts.findByIdForUser(postId, userId);
    if (!post) throw new NotFoundError('Post not found.');
    if (post.status !== 'PUBLISHED' || !post.linkedin?.postId) {
      throw new ConflictError('This post has not been published to LinkedIn yet.');
    }

    const counts = await this.linkedin.getPostEngagement(userId, post.linkedin.postId);
    const engagementRate = computeEngagementRate(counts);

    return this.analytics.recordSnapshot(postId, userId, { ...counts, engagementRate });
  }

  /**
   * @param {string} userId
   * @param {string} postId
   */
  async getPostAnalytics(userId, postId) {
    const post = await this.posts.findByIdForUser(postId, userId);
    if (!post) throw new NotFoundError('Post not found.');

    const analytics = await this.analytics.findByPostId(postId);
    if (!analytics) throw new NotFoundError('No analytics recorded for this post yet. Refresh it first.');
    return analytics;
  }

  /**
   * @param {string} userId
   * @returns {Promise<{
   *   totalPosts: number,
   *   totalImpressions: number,
   *   averageEngagementRate: number|null,
   *   bestPerformingPost: { postId: string, engagementRate: number }|null,
   * }>}
   */
  async getOverview(userId) {
    const rows = await this.analytics.findAllForUser(userId);
    const rated = rows.filter((row) => typeof row.engagementRate === 'number');

    const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
    const averageEngagementRate = rated.length
      ? Number((rated.reduce((sum, row) => sum + row.engagementRate, 0) / rated.length).toFixed(4))
      : null;

    const best = rated.reduce((champion, row) => {
      if (!champion || row.engagementRate > champion.engagementRate) return row;
      return champion;
    }, null);

    return {
      totalPosts: rows.length,
      totalImpressions,
      averageEngagementRate,
      bestPerformingPost: best ? { postId: best.postId.toString(), engagementRate: best.engagementRate } : null,
    };
  }

  /**
   * Requests an AI-narrated explanation of how a specific post performed
   * relative to the user's average (architecture doc §32).
   * @param {string} userId
   * @param {string} postId
   */
  async getPerformanceInsight(userId, postId) {
    const post = await this.posts.findByIdForUser(postId, userId);
    if (!post) throw new NotFoundError('Post not found.');

    const analytics = await this.analytics.findByPostId(postId);
    if (!analytics || typeof analytics.engagementRate !== 'number') {
      throw new ConflictError('This post needs analytics with a computable engagement rate first.');
    }

    const overview = await this.getOverview(userId);
    const averageEngagementRate = overview.averageEngagementRate ?? analytics.engagementRate;
    const deltaPercent = averageEngagementRate
      ? Number((((analytics.engagementRate - averageEngagementRate) / averageEngagementRate) * 100).toFixed(1))
      : 0;

    const insight = await this.ai.analyzePerformance(userId, {
      content: composePostText(post.content),
      performance: { engagementRate: analytics.engagementRate, averageEngagementRate, deltaPercent },
    });

    return { insight, performance: { engagementRate: analytics.engagementRate, averageEngagementRate, deltaPercent } };
  }
}
