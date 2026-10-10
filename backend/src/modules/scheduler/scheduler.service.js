const LOCK_TTL_SECONDS = 60;

export class SchedulerService {
  /**
   * @param {import('./scheduled-post.repository.js').ScheduledPostRepository} scheduledPostRepository
   * @param {import('./publish-event.publisher.js').PublishEventPublisher} publishEventPublisher
   * @param {import('../../infrastructure/redis/redis.service.js').RedisService} redisService
   * @param {import('../posts/posts.repository.js').PostRepository} postRepository
   */
  constructor(scheduledPostRepository, publishEventPublisher, redisService, postRepository) {
    this.scheduledPosts = scheduledPostRepository;
    this.publisher = publishEventPublisher;
    this.redis = redisService;
    this.posts = postRepository;
  }

  /**
   * Called on a poll interval by the worker process. Idempotent and
   * safe to run concurrently across multiple worker instances — the
   * Redis lock ensures only one of them actually dispatches a given
   * scheduled post.
   * @returns {Promise<{ dispatched: number, skipped: number }>}
   */
  async dispatchDuePosts() {
    const due = await this.scheduledPosts.findDue(new Date());
    let dispatched = 0;
    let skipped = 0;

    for (const item of due) {
      const lockKey = `lock:scheduled_post:${item._id}`;
      const acquired = await this.redis.setIfNotExists(lockKey, '1', LOCK_TTL_SECONDS);
      if (!acquired) {
        skipped += 1;
        continue;
      }

      try {
        // The SCHEDULED -> PUBLISHING transition (architecture doc §I)
        // happens here, at dispatch time — the consumer's idempotency
        // guard only acts on posts already in PUBLISHING, so this must
        // land before the event is published, not after.
        await this.posts.updateStatus(item.postId.toString(), 'PUBLISHING');
        await this.publisher.publishRequested({ postId: item.postId.toString(), userId: item.userId.toString() });
        await this.scheduledPosts.markDispatched(item._id);
        dispatched += 1;
      } catch (error) {
        await this.scheduledPosts.markFailed(item._id, error.message);
      }
    }

    return { dispatched, skipped };
  }
}
