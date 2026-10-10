import { createClient } from 'redis';
import { config } from '../config/env.js';
import { logger } from '../logger/index.js';

const redisLogger = logger.child({ module: 'redis' });

export const redisClient = createClient({ url: config.redisUrl });

redisClient.on('error', (error) => redisLogger.error('Redis client error', { error }));
redisClient.on('connect', () => redisLogger.info('Redis connecting'));
redisClient.on('ready', () => redisLogger.info('Redis connection ready'));
redisClient.on('end', () => redisLogger.warn('Redis connection closed'));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}
