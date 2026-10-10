import 'dotenv/config';

const REQUIRED_IN_PRODUCTION = [
  'MONGODB_URI',
  'REDIS_URL',
  'SESSION_SECRET',
  'CORS_ORIGIN',
];

const nodeEnv = process.env.NODE_ENV ?? 'development';

/**
 * Reads an env var, falling back to `fallback`. Throws in production if
 * neither is present and the key is in REQUIRED_IN_PRODUCTION.
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
function readEnv(key, fallback) {
  const value = process.env[key] ?? fallback;
  if (value === undefined && nodeEnv === 'production' && REQUIRED_IN_PRODUCTION.includes(key)) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(readEnv('PORT', '4000')),
  logLevel: readEnv('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug'),

  mongoUri: readEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/linkedin_copilot'),

  redisUrl: readEnv('REDIS_URL', 'redis://127.0.0.1:6379'),

  rabbitmqUrl: readEnv('RABBITMQ_URL', 'amqp://127.0.0.1:5672'),

  cors: Object.freeze({
    origin: readEnv('CORS_ORIGIN', 'http://localhost:5173'),
  }),

  session: Object.freeze({
    secret: readEnv('SESSION_SECRET', 'dev-only-insecure-secret-change-me'),
    cookieName: readEnv('SESSION_COOKIE_NAME', 'copilot.sid'),
    cookieDomain: readEnv('SESSION_COOKIE_DOMAIN', ''),
    maxAgeMs: Number(readEnv('SESSION_MAX_AGE_MS', String(1000 * 60 * 60 * 24 * 7))), // 7 days
  }),

  bcrypt: Object.freeze({
    saltRounds: Number(readEnv('BCRYPT_SALT_ROUNDS', '10')),
  }),

  frontendUrl: readEnv('FRONTEND_URL', 'http://localhost:5173'),

  linkedin: Object.freeze({
    clientId: readEnv('LINKEDIN_CLIENT_ID', ''),
    clientSecret: readEnv('LINKEDIN_CLIENT_SECRET', ''),
    redirectUri: readEnv('LINKEDIN_REDIRECT_URI', 'http://localhost:4000/api/linkedin/callback'),
  }),

  encryption: Object.freeze({
    key: readEnv('TOKEN_ENCRYPTION_KEY', ''),
  }),

  ai: Object.freeze({
    apiKey: readEnv('AI_API_KEY', ''),
    model: readEnv('AI_MODEL', 'gpt-4o-mini'),
  }),
});
