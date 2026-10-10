import mongoose from 'mongoose';

const DEFAULT_PAGE_SIZE = 20;

export class PostRepository {
  /** @param {import('mongoose').Model} postModel */
  constructor(postModel) {
    this.model = postModel;
  }

  /**
   * @param {string} userId
   * @param {Record<string, unknown>} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(userId, data) {
    return this.model.create({ userId, ...data });
  }

  /**
   * Returns `null` for both "doesn't exist" and "belongs to someone
   * else" — the caller can't distinguish the two, which is the point
   * (no resource-enumeration signal).
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByIdForUser(id, userId) {
    return this.model.findOne({ _id: id, userId }).exec();
  }

  /**
   * @param {string} userId
   * @param {{ status?: string, page?: number, pageSize?: number }} [options]
   * @returns {Promise<{ posts: import('mongoose').Document[], page: number, pageSize: number, total: number }>}
   */
  async listForUser(userId, { status, page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
    const filter = { userId, ...(status ? { status } : {}) };
    const [posts, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { posts, page, pageSize, total };
  }

  /**
   * Used by the async publish worker, which only has a bare `postId` (no
   * session) — still requires the `userId` from the queue message so a
   * malformed/forged message can never touch another user's post.
   * @param {string} id
   * @param {string} status
   * @param {Record<string, unknown>} [patch] dot-path keys, e.g. `{ 'linkedin.lastError': '...' }`
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async updateStatus(id, status, patch = {}) {
    const post = await this.model.findById(id).exec();
    if (!post) return null;
    post.status = status;
    for (const [path, value] of Object.entries(patch)) {
      post.set(path, value);
    }
    return post.save();
  }

  /**
   * @param {string} userId
   * @param {string[]} topicTags subset to aggregate over (all posts if omitted)
   * @returns {Promise<Array<{ _id: string, count: number }>>}
   */
  async countByTopicTag(userId) {
    return this.model.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$topicTags' },
      { $group: { _id: '$topicTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }
}
