import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ReviewStatus } from '@prisma/client';
import { ModerationAction } from '@prisma/client';
import { ReviewsRepository } from '../reviews/repositories/reviews.repository';
import { ModerationRepository } from './repositories/moderation.repository';
import {
  ModerationEngineService,
  type ModerationContext,
} from './services/moderation-engine.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly moderationRepository: ModerationRepository,
    private readonly moderationEngine: ModerationEngineService,
  ) {}

  async processReview(reviewId: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found for moderation`);
    }

    if (review.status !== 'PENDING') {
      this.logger.debug(`Review ${reviewId} already processed (${review.status})`);
      return;
    }

    const context: ModerationContext = {
      reviewId: review.id,
      userId: review.userId,
      companyId: review.companyId,
      content: review.content,
      title: review.title,
      deviceFingerprint: review.deviceFingerprint,
      userCreatedAt: review.user.createdAt,
    };

    const breakdown = await this.moderationEngine.evaluate(context);
    const maxSimilarity = await this.moderationEngine.getMaxSimilarity(context);
    const queueForReview = this.moderationEngine.shouldQueue(breakdown);
    const status: ReviewStatus = queueForReview ? 'PENDING' : 'APPROVED';
    const action: ModerationAction = queueForReview
      ? ModerationAction.QUEUED
      : ModerationAction.AUTO_APPROVED;

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status,
      moderationScore: breakdown.total,
      similarityScore: maxSimilarity > 0 ? maxSimilarity : undefined,
    });

    const reasons = this.moderationEngine.buildReasonLog(breakdown, maxSimilarity);

    await this.moderationRepository.createLog({
      reviewId,
      reason: reasons.join(', '),
      score: breakdown.total,
      action,
    });

    if (status === 'APPROVED') {
      await this.reviewsRepository.recalculateCompanyRating(review.companyId);
      await this.reviewsRepository.incrementUserReviewCount(review.userId);
    }

    this.logger.log(
      `Review ${reviewId} moderated: status=${status}, score=${breakdown.total}`,
    );
  }

  async manualApprove(reviewId: string, adminId: string): Promise<void> {
    await this.setManualStatus(reviewId, 'APPROVED', ModerationAction.MANUAL_APPROVED, adminId);
  }

  async manualReject(reviewId: string, adminId: string): Promise<void> {
    await this.setManualStatus(reviewId, 'REJECTED', ModerationAction.MANUAL_REJECTED, adminId);
  }

  private async setManualStatus(
    reviewId: string,
    status: ReviewStatus,
    action: ModerationAction,
    adminId: string,
  ): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const previousStatus = review.status;

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status,
      moderationScore: review.moderationScore,
    });

    await this.moderationRepository.createLog({
      reviewId,
      reason: `manual_${status.toLowerCase()}_by_admin:${adminId}`,
      score: review.moderationScore,
      action,
    });

    if (previousStatus !== 'APPROVED' && status === 'APPROVED') {
      await this.reviewsRepository.recalculateCompanyRating(review.companyId);
      await this.reviewsRepository.incrementUserReviewCount(review.userId);
    }

    if (previousStatus === 'APPROVED' && status !== 'APPROVED') {
      await this.reviewsRepository.recalculateCompanyRating(review.companyId);
      await this.reviewsRepository.decrementUserReviewCount(review.userId);
    }
  }
}
