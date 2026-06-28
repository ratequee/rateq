import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { ModerationRepository } from './repositories/moderation.repository';
import {
  ModerationEngineService,
  type ModerationContext,
} from './services/moderation-engine.service';
import type { ListProjectsQueryDto } from './dto/list-projects-query.dto';

export const NEGATIVE_REVIEW_MAX_RATING = 3;

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly moderationRepository: ModerationRepository,
    private readonly moderationEngine: ModerationEngineService,
    private readonly emailService: EmailService,
    private readonly adminActivity: AdminActivityService,
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

    const wasApproved = review.status === 'APPROVED';
    const { companyId, userId } = review;
    const reviewerEmail = review.user?.email;
    const companyName = review.company?.name ?? 'the company';

    await this.reviewsRepository.deleteById(reviewId);

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
    });

    await this.moderationRepository.createLog({
      reviewId,
      reason: `manual_resolve_by_admin:${adminId}`,
      score: review.moderationScore,
      action: ModerationAction.MANUAL_RESOLVE,
    });

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

    const allowedStatuses: ReviewStatus[] = ['PENDING', 'RESOLUTION_PENDING'];
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
      meta: buildPaginationMeta(total, page, limit),
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

    await this.companiesRepository.updateProjectStatus(projectId, 'APPROVED');

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
