import { config } from '../infrastructure/config/env.js';
import { logger } from '../infrastructure/logger/index.js';
import { connectMongo, disconnectMongo } from '../infrastructure/database/connection.js';
import { connectRedis, disconnectRedis } from '../infrastructure/redis/client.js';
import { connectRabbitMQ, disconnectRabbitMQ } from '../infrastructure/rabbitmq/connection.js';
import { buildApp } from './bootstrap/index.js';

const startupLogger = logger.child({ module: 'server' });

async function main() {
  await connectMongo();
  await connectRedis();
  await connectRabbitMQ();

  const app = buildApp();

  const httpServer = app.listen(config.port, () => {
    startupLogger.info('Server listening', { port: config.port, environment: config.nodeEnv });
  });

  const shutdown = async (signal) => {
    startupLogger.info('Shutdown signal received', { signal });
    httpServer.close();
    await Promise.all([disconnectMongo(), disconnectRedis(), disconnectRabbitMQ()]);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  startupLogger.error('Failed to start server', { error });
  process.exit(1);
});
