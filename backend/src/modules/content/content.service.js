import { NotFoundError } from '../../shared/errors/index.js';

const GAP_THRESHOLDS = Object.freeze({ high: 5, medium: 2, low: 1 });

/**
 * @param {number} count
 * @returns {'High'|'Medium'|'Low'|'Very Low'}
 */
function bucketFor(count) {
  if (count >= GAP_THRESHOLDS.high) return 'High';
  if (count >= GAP_THRESHOLDS.medium) return 'Medium';
  if (count >= GAP_THRESHOLDS.low) return 'Low';
  return 'Very Low';
}

export class ContentService {
  /**
   * @param {import('./content-idea.repository.js').ContentIdeaRepository} contentIdeaRepository
   * @param {import('./content-calendar.repository.js').ContentCalendarRepository} contentCalendarRepository
   * @param {import('../posts/posts.service.js').PostsService} postsService
   */
  constructor(contentIdeaRepository, contentCalendarRepository, postsService) {
    this.ideas = contentIdeaRepository;
    this.calendars = contentCalendarRepository;
    this.posts = postsService;
  }

  /**
   * @param {string} userId
   * @param {object} ideaData
   */
  async saveIdea(userId, ideaData) {
    return this.ideas.create(userId, ideaData);
  }

  /**
   * @param {string} userId
   * @param {{ status?: string }} query
   */
  async listIdeas(userId, query) {
    return this.ideas.listForUser(userId, query);
  }

  /**
   * @param {string} userId
   * @param {string} ideaId
   * @param {'used'|'dismissed'} status
   */
  async updateIdeaStatus(userId, ideaId, status) {
    const idea = await this.ideas.findByIdForUser(ideaId, userId);
    if (!idea) throw new NotFoundError('Idea not found.');
    idea.status = status;
    return idea.save();
  }

  /**
   * @param {string} userId
   * @param {string} weekStart
   */
  async getCalendar(userId, weekStart) {
    return this.calendars.findByUserAndWeek(userId, weekStart);
  }

  /**
   * @param {string} userId
   * @param {string} weekStart
   * @param {{ slots?: object[], preferences?: object }} data
   */
  async upsertCalendar(userId, weekStart, data) {
    return this.calendars.upsert(userId, weekStart, data);
  }

  /**
   * Deterministic distribution of the user's own post topics — no AI
   * call involved (architecture doc §23: the underlying aggregation is
   * plain data analysis; an AI-narrated recommendation on top of it is a
   * natural extension once this is in place, not a requirement of it).
   * @param {string} userId
   * @returns {Promise<Array<{ topic: string, count: number, level: string }>>}
   */
  async getGapAnalysis(userId) {
    const distribution = await this.posts.getTopicDistribution(userId);
    return distribution.map(({ topic, count }) => ({ topic, count, level: bucketFor(count) }));
  }
}
