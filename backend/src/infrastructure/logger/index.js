import { createLogger } from '@silay/logger';
import { config } from '../config/env.js';

export const logger = createLogger({
  service: 'linkedin-copilot-api',
  environment: config.nodeEnv,
  level: config.logLevel,
  format: config.isProduction ? 'json' : 'pretty',
  redact: ['sessionId', 'cookie', 'accessToken', 'refreshToken', 'passwordHash'],
});
