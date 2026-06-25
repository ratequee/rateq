import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { REVIEW_MODERATION_QUEUE } from '../../infrastructure/queue/queue.constants';
import { AdminActivityModule } from '../admin-activity/admin-activity.module';
import { EmailModule } from '../auth/email.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationRepository } from './repositories/moderation.repository';
import { ModerationEngineService } from './services/moderation-engine.service';
import { ReviewModerationProcessor } from './processors/review-moderation.processor';

@Module({
  imports: [
    ReviewsModule,
    EmailModule,
    AdminActivityModule,
    BullModule.registerQueue({ name: REVIEW_MODERATION_QUEUE }),
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    ModerationRepository,
    ModerationEngineService,
    ReviewModerationProcessor,
  ],
  exports: [ModerationService],
})
export class ModerationModule {}
