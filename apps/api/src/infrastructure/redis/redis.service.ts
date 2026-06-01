import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppConfig } from '../../common/config/env.validation';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const redisUrl = this.configService.get('REDIS_URL', { infer: true });
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
