import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { REVIEW_MODERATION_QUEUE } from '../../infrastructure/queue/queue.constants';
import { EmailModule } from '../auth/email.module';
import { CompaniesModule } from '../companies/companies.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewRateLimitService } from './services/review-rate-limit.service';

@Module({
  imports: [
    CompaniesModule,
    EmailModule,
    BullModule.registerQueue({ name: REVIEW_MODERATION_QUEUE }),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository, ReviewRateLimitService],
  exports: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
