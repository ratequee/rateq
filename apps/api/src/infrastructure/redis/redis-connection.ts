import type { RedisOptions } from 'ioredis';

/**
 * Options for short request/response Redis usage (OTP, rate limits, health).
 * Fail fast so a down Redis does not hang HTTP requests.
 */
export function createRedisConnectionOptions(): RedisOptions {
  return {
    lazyConnect: false,
    enableOfflineQueue: false,
    connectTimeout: 4000,
    commandTimeout: 4000,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
  };
}

/**
 * Options for BullMQ. Must not set commandTimeout — workers use blocking
 * commands (e.g. BZPOPMIN) that intentionally wait longer than a few seconds.
 * maxRetriesPerRequest must be null for workers.
 */
export function createBullRedisConnectionOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
  };
}

export function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || '127.0.0.1',
    port: parsed.port ? Number(parsed.port) : 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
  };
}
