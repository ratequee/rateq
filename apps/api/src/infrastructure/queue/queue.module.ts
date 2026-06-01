import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/env.validation';
import { REVIEW_MODERATION_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: {
          url: configService.get('REDIS_URL', { infer: true }),
        },
      }),
    }),
    BullModule.registerQueue({
      name: REVIEW_MODERATION_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
