import { redisClient } from './client.js';

export class RedisService {
  constructor() {
    this.client = redisClient;
  }

  /**
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    return this.client.get(key);
  }

  /**
   * @param {string} key
   * @param {string} value
   * @param {{ ttlSeconds?: number }} [options]
   * @returns {Promise<void>}
   */
  async set(key, value, { ttlSeconds } = {}) {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Sets a key only if it does not already exist — the building block for
   * distributed locks and idempotency guards in later phases.
   * @param {string} key
   * @param {string} value
   * @param {number} ttlSeconds
   * @returns {Promise<boolean>} true if the key was set (lock acquired)
   */
  async setIfNotExists(key, value, ttlSeconds) {
    const result = await this.client.set(key, value, { EX: ttlSeconds, NX: true });
    return result === 'OK';
  }

  /**
   * @param {string} key
   * @returns {Promise<number>}
   */
  async del(key) {
    return this.client.del(key);
  }

  /**
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    const count = await this.client.exists(key);
    return count > 0;
  }

  /**
   * Atomic counter — the basis for future rate-limit windows.
   * @param {string} key
   * @param {number} ttlSeconds applied only when the key is newly created
   * @returns {Promise<number>}
   */
  async increment(key, ttlSeconds) {
    const value = await this.client.incr(key);
    if (value === 1 && ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
    return value;
  }
}
