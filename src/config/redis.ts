import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = env.REDIS_URI ? new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries. Please configure REDIS_URI.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
}) : null;

if (redis) {
  redis.on('connect', () => {
    logger.info('Redis connection initiated');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
  });

  redis.on('error', (err) => {
    logger.error(`Redis connection error: ${err.message}`);
  });
}
