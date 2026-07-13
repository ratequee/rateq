import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { REVIEW_MODERATION_QUEUE } from '../../../infrastructure/queue/queue.constants';
import { ModerationService, RESOLUTION_CHOICE_TIMEOUT_JOB } from '../moderation.service';

export interface ReviewModerationJobPayload {
  reviewId: string;
}

@Processor(REVIEW_MODERATION_QUEUE)
export class ReviewModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewModerationProcessor.name);

  constructor(private readonly moderationService: ModerationService) {
    super();
  }

  async process(job: Job<ReviewModerationJobPayload>): Promise<void> {
    if (job.name === RESOLUTION_CHOICE_TIMEOUT_JOB) {
      this.logger.log(
        `Processing resolution-choice timeout job ${job.id} for review ${job.data.reviewId}`,
      );
      await this.moderationService.expireResolutionWindowChoice(job.data.reviewId);
      return;
    }

    this.logger.log(`Processing moderation job ${job.id} for review ${job.data.reviewId}`);
    await this.moderationService.processReview(job.data.reviewId);
  }
}
