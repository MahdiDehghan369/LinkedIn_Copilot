import amqp from 'amqplib';
import { config } from '../config/env.js';
import { logger } from '../logger/index.js';

const rabbitLogger = logger.child({ module: 'rabbitmq' });

const EXCHANGE_NAME = 'copilot.events';

export const QUEUES = Object.freeze({
  PUBLISH_REQUESTED: 'post.publish_requested',
});

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
  rabbitLogger.info('RabbitMQ connecting');
  connection = await amqp.connect(config.rabbitmqUrl);
  connection.on('error', (error) => rabbitLogger.error('RabbitMQ connection error', { error }));

  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  await channel.assertQueue(QUEUES.PUBLISH_REQUESTED, { durable: true });
  await channel.bindQueue(QUEUES.PUBLISH_REQUESTED, EXCHANGE_NAME, QUEUES.PUBLISH_REQUESTED);

  rabbitLogger.info('RabbitMQ connection ready');
  return channel;
}

export function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized — call connectRabbitMQ() first.');
  }
  return channel;
}

export function getExchangeName() {
  return EXCHANGE_NAME;
}

export async function disconnectRabbitMQ() {
  await channel?.close().catch(() => {});
  await connection?.close().catch(() => {});
  channel = null;
  connection = null;
}
