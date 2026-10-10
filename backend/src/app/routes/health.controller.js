import mongoose from 'mongoose';
import { redisClient } from '../../infrastructure/redis/client.js';

const MONGOOSE_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export class HealthController {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async check(req, res) {
    const mongoState = MONGOOSE_STATES[mongoose.connection.readyState] ?? 'unknown';
    const redisState = redisClient.isReady ? 'connected' : redisClient.isOpen ? 'connecting' : 'disconnected';
    const healthy = mongoState === 'connected' && redisState === 'connected';

    res.sendResponse(healthy ? 200 : 503, {
      status: healthy ? 'ok' : 'degraded',
      dependencies: {
        mongodb: mongoState,
        redis: redisState,
      },
    });
  }
}
