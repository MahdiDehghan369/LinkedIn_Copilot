import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../shared/errors/index.js";
import { assertTransition } from "./posts.state-machine.js";
import {
  saveImage,
  readImage,
  deleteImage,
} from "../../infrastructure/storage/local-file-storage.js";

const EDITABLE_STATUSES = new Set(["DRAFT", "GENERATED", "EDITED"]);
const APPROVABLE_STATUSES = new Set(["GENERATED", "EDITED", "FAILED"]);
const DELETABLE_STATUSES = new Set(["DRAFT", "CANCELLED", "FAILED"]);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB — comfortably covers LinkedIn's typical feed images

export class PostsService {
  /**
   * @param {import('./posts.repository.js').PostRepository} postRepository
   * @param {import('../scheduler/scheduled-post.repository.js').ScheduledPostRepository} scheduledPostRepository
   * @param {import('../scheduler/publish-event.publisher.js').PublishEventPublisher} publishEventPublisher
   */
  constructor(postRepository, scheduledPostRepository, publishEventPublisher) {
    this.posts = postRepository;
    this.scheduledPosts = scheduledPostRepository;
    this.publisher = publishEventPublisher;
  }

  /**
   * @param {string} userId
   * @param {{ content?: object, topicTags?: string[], originIdeaId?: string, sourceGenerationId?: string }} input
   */
  async create(userId, input) {
    const status = input.sourceGenerationId ? "GENERATED" : "DRAFT";
    return this.posts.create(userId, { ...input, status });
  }

  /**
   * @param {string} userId
   * @param {{ status?: string, page?: number, pageSize?: number }} query
   */
  async list(userId, query) {
    return this.posts.listForUser(userId, query);
  }

  /**
   * @param {string} userId
   * @param {string} postId
   */
  async getById(userId, postId) {
    const post = await this.posts.findByIdForUser(postId, userId);
    if (!post) throw new NotFoundError("Post not found.");
    return post;
  }

  /**
   * @param {string} userId
   * @param {string} postId
   * @param {{ content?: object, topicTags?: string[] }} patch
   */
  async updateContent(userId, postId, patch) {
    const post = await this.getById(userId, postId);
    if (!EDITABLE_STATUSES.has(post.status)) {
      throw new ConflictError(`Cannot edit a post with status ${post.status}.`);
    }

    if (patch.content) Object.assign(post.content, patch.content);
    if (patch.topicTags) post.topicTags = patch.topicTags;
    if (post.status !== "EDITED") post.status = "EDITED";

    return post.save();
  }

  /**
   * @param {string} userId
   * @param {string} postId
   */
  async delete(userId, postId) {
    const post = await this.getById(userId, postId);
    if (!DELETABLE_STATUSES.has(post.status)) {
      throw new ConflictError(
        `Cannot delete a post with status ${post.status}. Cancel it first.`,
      );
    }
    if (post.image?.storageKey) {
      await deleteImage(post.image.storageKey);
    }
    await post.deleteOne();
  }

  /**
   * @param {string} userId
   * @param {string} postId
   * @param {{ buffer: Buffer, originalname: string, mimetype: string, size: number }} file
   */
  async attachImage(userId, postId, file) {
    const post = await this.getById(userId, postId);
    if (!EDITABLE_STATUSES.has(post.status)) {
      throw new ConflictError(
        `Cannot change the image on a post with status ${post.status}.`,
      );
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new ValidationError(
        "Image must be a JPEG, PNG, GIF, or WebP file.",
      );
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new ValidationError("Image must be smaller than 8 MB.");
    }

    const previousKey = post.image?.storageKey;
    const storageKey = await saveImage(file.buffer, file.originalname);

    post.image = {
      storageKey,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
    if (post.status !== "EDITED") post.status = "EDITED";
    await post.save();

    if (previousKey) await deleteImage(previousKey); // replace, don't leak the old file
    return post;
  }

  /**
   * @param {string} userId
   * @param {string} postId
   */
  async removeImage(userId, postId) {
    const post = await this.getById(userId, postId);
    if (!EDITABLE_STATUSES.has(post.status)) {
      throw new ConflictError(
        `Cannot change the image on a post with status ${post.status}.`,
      );
    }
    if (post.image?.storageKey) {
      await deleteImage(post.image.storageKey);
    }
    post.image = undefined;
    return post.save();
  }

  /**
   * @param {string} userId
   * @param {string} postId
   */
  async approve(userId, postId) {
    const post = await this.getById(userId, postId);
    if (!APPROVABLE_STATUSES.has(post.status)) {
      throw new ConflictError(
        `Cannot approve a post with status ${post.status}.`,
      );
    }
    assertTransition(post.status, "APPROVED");
    post.status = "APPROVED";
    post.approvedAt = new Date();
    return post.save();
  }

  /**
   * @param {string} userId
   * @param {string} postId
   */
  async cancel(userId, postId) {
    const post = await this.getById(userId, postId);
    assertTransition(post.status, "CANCELLED");
    post.status = "CANCELLED";
    return post.save();
  }

  /**
   * "Publish now" — validates, transitions to PUBLISHING, and enqueues
   * the actual LinkedIn call. The HTTP response returns as soon as the
   * job is queued; the caller polls `GET /api/posts/:id` to see it reach
   * PUBLISHED or FAILED (architecture doc §26/§F).
   * @param {string} userId
   * @param {string} postId
   */
  async requestPublish(userId, postId) {
    const post = await this.getById(userId, postId);
    assertTransition(post.status, "PUBLISHING");
    post.status = "PUBLISHING";
    await post.save();

    await this.publisher.publishRequested({
      postId: post._id.toString(),
      userId,
    });
    return post;
  }

  /**
   * @param {string} userId
   * @param {string} postId
   * @param {Date} scheduledFor
   */
  async schedule(userId, postId, scheduledFor) {
    const post = await this.getById(userId, postId);
    assertTransition(post.status, "SCHEDULED");
    post.status = "SCHEDULED";
    post.scheduledFor = scheduledFor;
    await post.save();

    await this.scheduledPosts.create({
      postId: post._id,
      userId,
      runAt: scheduledFor,
    });
    return post;
  }

  /**
   * @param {string} userId
   * @param {string} postId
   * @returns {Promise<{ post: import('mongoose').Document, buffer: Buffer }>}
   */
  async getImageFile(userId, postId) {
    const post = await this.getById(userId, postId);
    if (!post.image?.storageKey)
      throw new NotFoundError("This post has no image.");
    const buffer = await readImage(post.image.storageKey);
    return { post, buffer };
  }

  /**
   * @param {string} userId
   * @returns {Promise<Array<{ topic: string, count: number }>>}
   */
  async getTopicDistribution(userId) {
    const rows = await this.posts.countByTopicTag(userId);
    return rows.map((row) => ({ topic: row._id, count: row.count }));
  }
}
