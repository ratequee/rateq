import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppConfig } from '../../common/config/env.validation';
import { createRedisConnectionOptions } from './redis-connection';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const redisUrl = this.configService.get('REDIS_URL', { infer: true });
    this.client = new Redis(redisUrl, createRedisConnectionOptions());
    this.client.on('error', (error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    this.client.removeAllListeners('error');
    await this.client.quit();
  }
}
