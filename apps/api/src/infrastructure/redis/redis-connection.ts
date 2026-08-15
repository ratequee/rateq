import type { RedisOptions } from 'ioredis';

/**
 * Shared Redis options so a down Redis instance fails fast instead of hanging
 * HTTP requests (ioredis otherwise retries forever and queues commands offline).
 */
export function createRedisConnectionOptions(): RedisOptions {
  return {
    lazyConnect: false,
    enableOfflineQueue: false,
    connectTimeout: 4000,
    commandTimeout: 4000,
    maxRetriesPerRequest: null,
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
