import { getChannel, getExchangeName, QUEUES } from '../../infrastructure/rabbitmq/connection.js';

export class PublishEventPublisher {
  /**
   * @param {{ postId: string, userId: string }} job
   */
  async publishRequested({ postId, userId }) {
    const channel = getChannel();
    const payload = JSON.stringify({ postId, userId, enqueuedAt: new Date().toISOString() });
    channel.publish(getExchangeName(), QUEUES.PUBLISH_REQUESTED, Buffer.from(payload), {
      persistent: true,
      contentType: 'application/json',
    });
  }
}
