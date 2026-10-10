import { config } from '../infrastructure/config/env.js';
import { logger } from '../infrastructure/logger/index.js';
import { connectMongo, disconnectMongo } from '../infrastructure/database/connection.js';
import { connectRedis, disconnectRedis } from '../infrastructure/redis/client.js';
import { connectRabbitMQ, disconnectRabbitMQ, getChannel, QUEUES } from '../infrastructure/rabbitmq/connection.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';

import { PostModel } from '../modules/posts/posts.model.js';
import { PostRepository } from '../modules/posts/posts.repository.js';
import { PublishPostUseCase } from '../modules/posts/publish-post.use-case.js';

import { LinkedInAccountModel } from '../modules/linkedin/linkedin.model.js';
import { LinkedInAccountRepository } from '../modules/linkedin/linkedin.repository.js';
import { LinkedInClient } from '../modules/linkedin/linkedin.client.js';
import { LinkedInService } from '../modules/linkedin/linkedin.service.js';

import { ScheduledPostModel } from '../modules/scheduler/scheduled-post.model.js';
import { ScheduledPostRepository } from '../modules/scheduler/scheduled-post.repository.js';
import { PublishEventPublisher } from '../modules/scheduler/publish-event.publisher.js';
import { SchedulerService } from '../modules/scheduler/scheduler.service.js';

import { NotificationModel } from '../modules/notifications/notification.model.js';
import { NotificationRepository } from '../modules/notifications/notification.repository.js';
import { NotificationService, NOTIFICATION_TYPES } from '../modules/notifications/notification.service.js';

const workerLogger = logger.child({ module: 'worker' });

const MAX_PUBLISH_ATTEMPTS = 3;
const SCHEDULER_POLL_INTERVAL_MS = 30_000;
const NON_RETRYABLE_CODES = new Set(['LINKEDIN_VALIDATION_ERROR', 'LINKEDIN_NOT_CONNECTED']);

/**
 * Handles one `post.publish_requested` message: run the use case, and on
 * failure decide retry (republish with an incremented attempt count) vs.
 * permanent failure (mark the Post FAILED — see the durability note in
 * `infrastructure/rabbitmq/connection.js`). Either terminal outcome also
 * notifies the user (architecture doc §34's own examples: "Post
 * published successfully" / "Post publishing failed").
 *
 * @param {import('amqplib').Message} msg
 * @param {{
 *   channel: import('amqplib').Channel,
 *   publishPostUseCase: PublishPostUseCase,
 *   postRepository: PostRepository,
 *   notificationService: NotificationService,
 * }} deps
 */
async function handlePublishMessage(msg, { channel, publishPostUseCase, postRepository, notificationService }) {
  if (!msg) return;

  const { postId, userId } = JSON.parse(msg.content.toString());
  const attempts = (msg.properties.headers?.['x-attempts'] ?? 0) + 1;

  try {
    await publishPostUseCase.execute({ postId, userId });
    channel.ack(msg);
    workerLogger.info('Publish job succeeded', { postId, userId, attempts });
    await notificationService.create(userId, {
      type: NOTIFICATION_TYPES.POST_PUBLISHED,
      message: 'Your post was published to LinkedIn.',
      relatedEntity: { type: 'Post', id: postId },
    });
  } catch (error) {
    const isNonRetryable = NON_RETRYABLE_CODES.has(error?.code);

    if (isNonRetryable || attempts >= MAX_PUBLISH_ATTEMPTS) {
      await postRepository.updateStatus(postId, 'FAILED', {
        'linkedin.lastError': error.message,
        'linkedin.retryCount': attempts,
      });
      channel.ack(msg);
      workerLogger.warn('Publish job failed permanently', {
        postId,
        userId,
        attempts,
        code: error.code,
        error,
      });
      await notificationService.create(userId, {
        type: NOTIFICATION_TYPES.POST_PUBLISH_FAILED,
        message: `Your post failed to publish: ${error.message}`,
        relatedEntity: { type: 'Post', id: postId },
      });
    } else {
      channel.ack(msg);
      channel.sendToQueue(QUEUES.PUBLISH_REQUESTED, msg.content, {
        persistent: true,
        headers: { 'x-attempts': attempts },
      });
      workerLogger.warn('Publish job failed, retrying', { postId, userId, attempts, error });
    }
  }
}

async function main() {
  await connectMongo();
  await connectRedis();
  await connectRabbitMQ();

  const redisService = new RedisService();

  const notificationRepository = new NotificationRepository(NotificationModel);
  const notificationService = new NotificationService(notificationRepository);

  const postRepository = new PostRepository(PostModel);

  const linkedInAccountRepository = new LinkedInAccountRepository(LinkedInAccountModel);
  const linkedinClient = new LinkedInClient();
  const linkedinService = new LinkedInService(
    linkedInAccountRepository,
    linkedinClient,
    redisService,
    notificationService,
  );
  const publishPostUseCase = new PublishPostUseCase(postRepository, linkedinService);

  const scheduledPostRepository = new ScheduledPostRepository(ScheduledPostModel);
  const publishEventPublisher = new PublishEventPublisher();
  const schedulerService = new SchedulerService(scheduledPostRepository, publishEventPublisher, redisService, postRepository);

  const channel = getChannel();
  await channel.prefetch(1);
  await channel.consume(QUEUES.PUBLISH_REQUESTED, (msg) =>
    handlePublishMessage(msg, { channel, publishPostUseCase, postRepository, notificationService }),
  );

  const pollTimer = setInterval(() => {
    schedulerService
      .dispatchDuePosts()
      .then(({ dispatched, skipped }) => {
        if (dispatched > 0) workerLogger.info('Scheduler dispatch cycle', { dispatched, skipped });
      })
      .catch((error) => workerLogger.error('Scheduler dispatch failed', { error }));
  }, SCHEDULER_POLL_INTERVAL_MS);

  workerLogger.info('Worker started', {
    environment: config.nodeEnv,
    pollIntervalMs: SCHEDULER_POLL_INTERVAL_MS,
  });

  const shutdown = async (signal) => {
    workerLogger.info('Shutdown signal received', { signal });
    clearInterval(pollTimer);
    await Promise.all([disconnectMongo(), disconnectRedis(), disconnectRabbitMQ()]);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  workerLogger.error('Worker failed to start', { error });
  process.exit(1);
});
