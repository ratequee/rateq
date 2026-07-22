import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { ReviewStatus } from '@prisma/client';
import { ModerationAction } from '@prisma/client';
import type { PaginatedAdminProjectsResponse } from '@rateq/types';
import { EmailService } from '../auth/services/email.service';
import { AdminActivityService } from '../admin-activity/admin-activity.service';
import { AdminActivityAction, AdminActivityEntityType } from '@rateq/types';
import { ReviewsRepository } from '../reviews/repositories/reviews.repository';
import { resolveCompanyOwnerEmail, resolveReviewerContact } from '../reviews/mappers/review.mapper';
import { CompaniesRepository } from '../companies/repositories/companies.repository';
import { toAdminCompanyProjectListItem } from '../companies/mappers/company.mapper';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { REVIEW_MODERATION_QUEUE } from '../../infrastructure/queue/queue.constants';
import { ModerationRepository } from './repositories/moderation.repository';
import {
  ModerationEngineService,
  type ModerationContext,
} from './services/moderation-engine.service';
import { ProjectImageWatermarkService } from '../companies/services/project-image-watermark.service';
import type { ListProjectsQueryDto } from './dto/list-projects-query.dto';

export const NEGATIVE_REVIEW_MAX_RATING = 3;
/** Company must choose 7/14 day window within this period after admin resolve. */
export const RESOLUTION_CHOICE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
export const RESOLUTION_CHOICE_TIMEOUT_JOB = 'resolution-choice-timeout';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly moderationRepository: ModerationRepository,
    private readonly moderationEngine: ModerationEngineService,
    private readonly projectImageWatermark: ProjectImageWatermarkService,
    private readonly emailService: EmailService,
    private readonly adminActivity: AdminActivityService,
    @InjectQueue(REVIEW_MODERATION_QUEUE)
    private readonly moderationQueue: Queue,
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
      hashedIp: review.hashedIp,
      deviceFingerprint: review.deviceFingerprint,
      userCreatedAt: review.user.createdAt,
    };

    const breakdown = await this.moderationEngine.evaluate(context);
    const maxSimilarity = await this.moderationEngine.getMaxSimilarity(context);
    const reasons = this.moderationEngine.buildReasonLog(breakdown, maxSimilarity);
    const isNegativeReview = review.rating <= NEGATIVE_REVIEW_MAX_RATING;

    if (isNegativeReview && !reasons.includes('negative_rating')) {
      reasons.unshift('negative_rating');
    }

    const shouldHold = true;

    if (shouldHold) {
      await this.reviewsRepository.updateModerationResult(reviewId, {
        status: 'PENDING',
        moderationScore: breakdown.total,
        similarityScore: maxSimilarity > 0 ? maxSimilarity : undefined,
      });

      await this.moderationRepository.createLog({
        reviewId,
        reason: reasons.join(', '),
        score: breakdown.total,
        action:
          isNegativeReview ||
          breakdown.velocity > 0 ||
          breakdown.ipHash > 0 ||
          breakdown.fingerprint > 0 ||
          breakdown.similarity > 0
            ? ModerationAction.FLAGGED
            : ModerationAction.QUEUED,
      });

      this.logger.log(
        `Review ${reviewId} held for admin moderation (score=${breakdown.total}, rating=${review.rating})`,
      );
      return;
    }
  }

  async manualApproveReply(reviewId: string, adminId: string): Promise<void> {
    const reply = await this.reviewsRepository.findReplyByReviewId(reviewId);
    if (!reply) {
      throw new NotFoundException('Reply not found');
    }
    if (reply.status !== 'PENDING') {
      throw new BadRequestException('Only pending replies can be approved');
    }

    await this.reviewsRepository.updateReplyStatus(reviewId, 'APPROVED');

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.REVIEW,
      entityId: reviewId,
      entityLabel: 'Company reply approved',
      action: AdminActivityAction.APPROVED,
    });

    await this.notifyCompanyReplyDecision(reviewId, 'approved');
  }

  async manualRejectReply(reviewId: string, adminId: string): Promise<void> {
    const reply = await this.reviewsRepository.findReplyByReviewId(reviewId);
    if (!reply) {
      throw new NotFoundException('Reply not found');
    }
    if (reply.status !== 'PENDING') {
      throw new BadRequestException('Only pending replies can be rejected');
    }

    await this.reviewsRepository.updateReplyStatus(reviewId, 'REJECTED');

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.REVIEW,
      entityId: reviewId,
      entityLabel: 'Company reply rejected',
      action: AdminActivityAction.REJECTED,
    });

    await this.notifyCompanyReplyDecision(reviewId, 'rejected');
  }

  async manualApprove(reviewId: string, adminId: string): Promise<void> {
    await this.setManualStatus(reviewId, 'APPROVED', ModerationAction.MANUAL_APPROVED, adminId);
    await this.notifyReviewerDecision(reviewId, 'approved');
    await this.notifyCompanyReviewPublished(reviewId);
  }

  async manualReject(reviewId: string, adminId: string): Promise<void> {
    await this.setManualStatus(reviewId, 'REJECTED', ModerationAction.MANUAL_REJECTED, adminId);
    await this.notifyReviewerDecision(reviewId, 'rejected');
  }

  async manualDelete(reviewId: string, adminId: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.status === 'DELETED') {
      throw new BadRequestException('Review is already deleted');
    }

    const wasApproved = review.status === 'APPROVED';
    const { companyId, userId } = review;
    const reviewerEmail = review.user?.email;
    const companyName = review.company?.name ?? 'the company';

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status: 'DELETED',
      moderationScore: review.moderationScore,
      resolutionRequestedAt: null,
      resolutionWindowDays: null,
      resolutionDeadlineAt: null,
    });

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.REVIEW,
      entityId: reviewId,
      entityLabel: review.title,
      action: AdminActivityAction.DELETED,
    });

    if (wasApproved) {
      await this.reviewsRepository.recalculateCompanyRating(companyId);
      await this.reviewsRepository.decrementUserReviewCount(userId);
    }

    if (reviewerEmail) {
      try {
        await this.emailService.sendReviewDeletedEmail({
          reviewerEmail,
          reviewTitle: review.title,
          companyName,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to send review deleted email to ${reviewerEmail}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    this.logger.log(`Admin ${adminId} deleted review ${reviewId}`);
  }

  async adminDeleteReply(reviewId: string, adminId: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const reply = await this.reviewsRepository.findReplyByReviewId(reviewId);

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    await this.reviewsRepository.deleteReply(reviewId);

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.REVIEW,
      entityId: reviewId,
      entityLabel: `Reply on "${review.title}"`,
      action: AdminActivityAction.DELETED,
    });

    this.logger.log(`Admin ${adminId} deleted reply on review ${reviewId}`);
  }

  async manualResolve(reviewId: string, adminId: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== 'PENDING') {
      throw new BadRequestException('Only pending reviews can be sent for resolution');
    }

    if (review.rating > NEGATIVE_REVIEW_MAX_RATING) {
      throw new BadRequestException(
        'Resolve is only available for negative reviews (3 stars or below)',
      );
    }

    const companyEmail = resolveCompanyOwnerEmail(review);
    if (!companyEmail) {
      throw new BadRequestException('Company owner email is not available for resolution');
    }

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status: 'RESOLUTION_PENDING',
      moderationScore: review.moderationScore,
      resolutionRequestedAt: new Date(),
      resolutionWindowDays: null,
      resolutionDeadlineAt: null,
      incrementResolutionSentCount: true,
    });

    await this.moderationRepository.createLog({
      reviewId,
      reason: `manual_resolve_by_admin:${adminId}`,
      score: review.moderationScore,
      action: ModerationAction.MANUAL_RESOLVE,
    });

    await this.scheduleResolutionChoiceTimeout(reviewId);

    const reviewer = resolveReviewerContact(review);
    const companyName = review.company?.name ?? 'Company';

    await this.emailService.sendReviewResolutionToCompanyEmail({
      companyEmail,
      companyName,
      reviewTitle: review.title,
      reviewContent: review.content,
      reviewRating: review.rating,
      reviewerName: reviewer.name,
      reviewerEmail: reviewer.email,
      reviewerPhone: reviewer.phone,
    });

    await this.emailService.sendReviewResolutionToReviewerEmail({
      reviewerEmail: reviewer.email,
      companyName,
      reviewTitle: review.title,
    });

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.REVIEW,
      entityId: reviewId,
      entityLabel: review.title,
      action: AdminActivityAction.RESOLVED,
    });
  }

  /**
   * If company did not pick 7/14 days within 24h, return review to PENDING for admin.
   */
  async expireResolutionWindowChoice(reviewId: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) return;

    if (review.status !== 'RESOLUTION_PENDING') return;
    if (review.resolutionDeadlineAt) return;

    const requestedAt = review.resolutionRequestedAt ?? review.updatedAt;
    const deadline = requestedAt.getTime() + RESOLUTION_CHOICE_TIMEOUT_MS;
    if (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      await this.scheduleResolutionChoiceTimeout(reviewId, remaining);
      return;
    }

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status: 'PENDING',
      moderationScore: review.moderationScore,
      resolutionRequestedAt: null,
      resolutionWindowDays: null,
      resolutionDeadlineAt: null,
    });

    await this.moderationRepository.createLog({
      reviewId,
      reason: 'resolution_window_choice_timeout_24h',
      score: review.moderationScore,
      action: ModerationAction.MANUAL_RESOLVE,
    });

    this.logger.log(
      `Review ${reviewId} returned to PENDING — company did not set resolution window within 24h`,
    );
  }

  async cancelResolutionChoiceTimeout(reviewId: string): Promise<void> {
    const jobId = `resolution-choice-${reviewId}`;
    try {
      const job = await this.moderationQueue.getJob(jobId);
      if (job) await job.remove();
    } catch (error) {
      this.logger.warn(
        `Could not cancel resolution choice timeout for ${reviewId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  private async scheduleResolutionChoiceTimeout(
    reviewId: string,
    delayMs = RESOLUTION_CHOICE_TIMEOUT_MS,
  ): Promise<void> {
    const jobId = `resolution-choice-${reviewId}`;
    try {
      const existing = await this.moderationQueue.getJob(jobId);
      if (existing) await existing.remove();
    } catch {
      // ignore
    }

    await this.moderationQueue.add(
      RESOLUTION_CHOICE_TIMEOUT_JOB,
      { reviewId },
      {
        jobId,
        delay: Math.max(delayMs, 1000),
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  private async notifyReviewerDecision(
    reviewId: string,
    decision: 'approved' | 'rejected',
  ): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review?.user?.email) return;

    const companyName = review.company?.name ?? 'the company';

    if (decision === 'approved') {
      await this.emailService.sendReviewApprovedEmail({
        reviewerEmail: review.user.email,
        reviewTitle: review.title,
        companyName,
      });
      return;
    }

    await this.emailService.sendReviewRejectedEmail({
      reviewerEmail: review.user.email,
      reviewTitle: review.title,
      companyName,
    });
  }

  private async notifyCompanyReviewPublished(reviewId: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) return;

    const companyEmail = resolveCompanyOwnerEmail(review);
    if (!companyEmail) return;

    await this.emailService.sendReviewPublishedEmails({
      reviewerEmail: '',
      companyEmail,
      companyName: review.company?.name ?? 'Company',
      reviewTitle: review.title,
    });
  }

  private async notifyCompanyReplyDecision(
    reviewId: string,
    decision: 'approved' | 'rejected',
  ): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) return;

    const companyEmail = resolveCompanyOwnerEmail(review);
    if (!companyEmail) return;

    const payload = {
      companyEmail,
      companyName: review.company?.name ?? 'your company',
      reviewTitle: review.title,
    };

    try {
      if (decision === 'approved') {
        await this.emailService.sendReviewReplyApprovedEmail(payload);
        return;
      }

      await this.emailService.sendReviewReplyRejectedEmail(payload);
    } catch (error) {
      this.logger.warn(
        `Failed to send reply ${decision} email to ${companyEmail}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
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

    const allowedStatuses: ReviewStatus[] = [
      'PENDING',
      'RESOLUTION_PENDING',
      'MODIFIED',
      'PROCEEDED',
    ];
    if (!allowedStatuses.includes(review.status)) {
      throw new BadRequestException('This review can no longer be moderated');
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

    const activityAction =
      status === 'APPROVED'
        ? AdminActivityAction.APPROVED
        : status === 'REJECTED'
          ? AdminActivityAction.REJECTED
          : null;

    if (activityAction) {
      await this.adminActivity.log({
        adminId,
        entityType: AdminActivityEntityType.REVIEW,
        entityId: reviewId,
        entityLabel: review.title,
        action: activityAction,
      });
    }

    if (previousStatus !== 'APPROVED' && status === 'APPROVED') {
      await this.reviewsRepository.recalculateCompanyRating(review.companyId);
      await this.reviewsRepository.incrementUserReviewCount(review.userId);
    }

    if (previousStatus === 'APPROVED' && status !== 'APPROVED') {
      await this.reviewsRepository.recalculateCompanyRating(review.companyId);
      await this.reviewsRepository.decrementUserReviewCount(review.userId);
    }
  }

  async listProjects(query: ListProjectsQueryDto): Promise<PaginatedAdminProjectsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      this.companiesRepository.findProjectsForModeration({
        status: query.status,
        page,
        limit,
      }),
      this.companiesRepository.countProjectsForModeration(query.status),
    ]);

    return {
      data: items.map(toAdminCompanyProjectListItem),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async manualApproveProject(projectId: string, adminId: string): Promise<void> {
    const project = await this.companiesRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'PENDING') {
      throw new BadRequestException('This project can no longer be moderated');
    }

    const demoImages = Array.isArray(project.demoImages)
      ? project.demoImages.filter((item): item is string => typeof item === 'string')
      : [];

    const watermarked = await this.projectImageWatermark.watermarkProjectImages({
      projectId: project.id,
      companyId: project.companyId,
      imageUrl: project.imageUrl,
      demoImages,
    });

    await this.companiesRepository.updateProjectImages(projectId, {
      imageUrl: watermarked.imageUrl,
      demoImages: watermarked.demoImages,
      status: 'APPROVED',
    });

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.COMPANY_PROFILE_CHANGE,
      entityId: projectId,
      entityLabel: project.title,
      action: AdminActivityAction.APPROVED,
    });

    await this.notifyCompanyProjectDecision(projectId, 'approved');
  }

  async manualRejectProject(projectId: string, adminId: string): Promise<void> {
    const project = await this.companiesRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'PENDING') {
      throw new BadRequestException('This project can no longer be moderated');
    }

    await this.companiesRepository.updateProjectStatus(projectId, 'REJECTED');

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.COMPANY_PROFILE_CHANGE,
      entityId: projectId,
      entityLabel: project.title,
      action: AdminActivityAction.REJECTED,
    });

    await this.notifyCompanyProjectDecision(projectId, 'rejected');
  }

  async manualDeleteProject(projectId: string, adminId: string): Promise<void> {
    const project = await this.companiesRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.companiesRepository.deleteProjectById(projectId);

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.COMPANY_PROFILE_CHANGE,
      entityId: projectId,
      entityLabel: project.title,
      action: AdminActivityAction.DELETED,
    });
  }

  private async notifyCompanyProjectDecision(
    projectId: string,
    decision: 'approved' | 'rejected',
  ): Promise<void> {
    const project = await this.companiesRepository.findProjectById(projectId);
    if (!project) return;

    const companyEmail = project.company.owner?.email ?? project.company.email ?? null;
    if (!companyEmail) return;

    const payload = {
      companyEmail,
      companyName: project.company.name,
      projectTitle: project.title,
    };

    try {
      if (decision === 'approved') {
        await this.emailService.sendCompanyProjectApprovedEmail(payload);
        return;
      }

      await this.emailService.sendCompanyProjectRejectedEmail(payload);
    } catch (error) {
      this.logger.warn(
        `Failed to send project ${decision} email to ${companyEmail}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
