import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/env.validation';
import { createBullRedisConnectionOptions, parseRedisUrl } from '../redis/redis-connection';
import { REVIEW_MODERATION_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const url = configService.get('REDIS_URL', { infer: true });
        return {
          connection: {
            ...parseRedisUrl(url),
            ...createBullRedisConnectionOptions(),
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: REVIEW_MODERATION_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
