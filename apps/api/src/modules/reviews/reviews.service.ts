import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  AuthenticatedUser,
  CreateReviewInput,
  PaginatedReviewsResponse,
  ReviewPublic,
  ReviewerDashboard,
} from '@rateq/types';
import { ReviewStatus, UserRole } from '@rateq/types';
import { hashIp } from '../../common/utils/ip-hash.util';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/env.validation';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { withTimeout } from '../../common/utils/with-timeout.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CompaniesRepository } from '../companies/repositories/companies.repository';
import { EmailService } from '../auth/services/email.service';
import { ReviewsRepository } from './repositories/reviews.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { REVIEW_MODERATION_QUEUE } from '../../infrastructure/queue/queue.constants';
import type { ReviewModerationJobPayload } from '../moderation/processors/review-moderation.processor';
import { ReviewRateLimitService } from './services/review-rate-limit.service';
import {
  resolveCompanyOwnerEmail,
  resolveReviewerContact,
  mapReviewsPublic,
  toReviewPublic,
} from './mappers/review.mapper';
import type { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import type { CreateReviewReplyDto } from './dto/create-reply.dto';
import type { SetResolutionWindowDto } from './dto/set-resolution-window.dto';
import type { ModifyResolutionDto } from './dto/modify-resolution.dto';
import { ModerationAction } from '@prisma/client';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly emailService: EmailService,
    @InjectQueue(REVIEW_MODERATION_QUEUE)
    private readonly moderationQueue: Queue<ReviewModerationJobPayload>,
    private readonly rateLimitService: ReviewRateLimitService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  async submit(
    user: AuthenticatedUser,
    input: CreateReviewInput,
    request: Request,
  ): Promise<ReviewPublic> {
    if (!user.isVerified) {
      throw new ForbiddenException('Verify your email before submitting reviews');
    }

    if (user.role === UserRole.COMPANY) {
      throw new ForbiddenException('Company accounts cannot submit reviews');
    }

    const company = await this.companiesRepository.findById(input.companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.owner && !company.owner.isActive) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId === user.id) {
      throw new ForbiddenException('You cannot review your own company');
    }

    const [publishedReview, inFlightReview] = await Promise.all([
      this.reviewsRepository.findPublishedByUserAndCompany(user.id, input.companyId),
      this.reviewsRepository.findInFlightReviewByUserAndCompany(user.id, input.companyId),
    ]);

    if (publishedReview) {
      throw new ConflictException('You already have a published review for this company');
    }

    if (inFlightReview) {
      throw new ConflictException('You already have a review pending for this company');
    }

    const clientIp = this.extractClientIp(request);
    const ipSecret = this.configService.get('IP_HASH_SECRET', { infer: true });
    const hashedIp = clientIp ? hashIp(clientIp, ipSecret) : undefined;

    await this.rateLimitService.assertWithinLimit(user.id, hashedIp);

    const aggregateRating = input.rating;
    if (!aggregateRating) {
      throw new BadRequestException('Overall rating is required');
    }

    if (!input.proofUrls?.length) {
      throw new BadRequestException('A proof file is required when submitting a review');
    }

    if (input.proofUrls.length > 8) {
      throw new BadRequestException('You can upload up to 8 proof files per review');
    }

    const normalizedTitle = input.title.trim().replace(/\s+/g, ' ');
    const normalizedContent = input.content.trim().replace(/\s+/g, ' ');
    if (normalizedTitle.length < 3 || normalizedContent.length < 20) {
      throw new BadRequestException('Review title or content is too short');
    }

    const review = await this.reviewsRepository.create({
      userId: user.id,
      companyId: input.companyId,
      rating: aggregateRating,
      title: normalizedTitle,
      content: normalizedContent,
      hashedIp,
      deviceFingerprint: input.deviceFingerprint,
      proofUrls: input.proofUrls,
    });

    try {
      await withTimeout(
        this.moderationQueue.add(
          'process-review',
          { reviewId: review.id },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        ),
        4000,
        'enqueue review moderation',
      );
    } catch (error) {
      this.logger.error(
        `Could not enqueue moderation for review ${review.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    const full = await this.reviewsRepository.findById(review.id);

    return toReviewPublic(full!);
  }

  async listByCompany(
    companyId: string,
    query: ListReviewsQueryDto,
  ): Promise<PaginatedReviewsResponse> {
    return this.listCompanyReviews(companyId, query, ReviewStatus.APPROVED);
  }

  async listFeatured(limit = 6): Promise<PaginatedReviewsResponse> {
    const filters = {
      status: ReviewStatus.APPROVED,
      page: 1,
      limit,
    };

    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findMany(filters),
      this.reviewsRepository.count(filters),
    ]);

    return {
      data: reviews.map((review) => toReviewPublic(review)),
      meta: buildPaginationMeta(1, limit, total),
    };
  }

  async listByCompanyForOwner(
    user: AuthenticatedUser,
    companyId: string,
    query: ListReviewsQueryDto,
  ): Promise<PaginatedReviewsResponse> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized to manage reviews for this company');
    }

    if (query.status === ReviewStatus.REJECTED || query.status === ReviewStatus.DELETED) {
      return {
        data: [],
        meta: buildPaginationMeta(query.page, query.limit, 0),
      };
    }

    const companyVisibleStatuses: ReviewStatus[] = [
      ReviewStatus.APPROVED,
      ReviewStatus.RESOLUTION_PENDING,
    ];

    if (query.status && !companyVisibleStatuses.includes(query.status)) {
      return {
        data: [],
        meta: buildPaginationMeta(query.page, query.limit, 0),
      };
    }

    return this.listCompanyReviews(
      companyId,
      query,
      query.status,
      true,
      query.status ? undefined : companyVisibleStatuses,
    );
  }

  private async listCompanyReviews(
    companyId: string,
    query: ListReviewsQueryDto,
    status?: ReviewStatus,
    includeUnpublishedReply = false,
    includeStatuses?: ReviewStatus[],
  ): Promise<PaginatedReviewsResponse> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const filters = {
      companyId,
      status,
      ...(includeStatuses?.length ? { includeStatuses } : {}),
      ...(includeUnpublishedReply && !includeStatuses?.length && !status
        ? { excludeStatuses: [ReviewStatus.REJECTED, ReviewStatus.DELETED] }
        : {}),
      categoryId: query.categoryId,
      search: query.search,
      page: query.page,
      limit: query.limit,
    };

    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findMany(filters),
      this.reviewsRepository.count(filters),
    ]);

    return {
      data: mapReviewsPublic(
        reviews,
        includeUnpublishedReply
          ? { includeUnpublishedReply: true, includeReviewerContact: true }
          : undefined,
      ),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listMyReviews(
    userId: string,
    query: ListReviewsQueryDto,
  ): Promise<PaginatedReviewsResponse> {
    const filters = {
      userId,
      companyId: query.companyId,
      status: query.status,
      categoryId: query.categoryId,
      search: query.search,
      page: query.page,
      limit: query.limit,
    };

    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findByUserId(userId, filters),
      this.reviewsRepository.countByUserId(userId, filters),
    ]);

    return {
      data: reviews.map((review) => toReviewPublic(review)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listForAdmin(query: ListReviewsQueryDto): Promise<PaginatedReviewsResponse> {
    await this.reviewsRepository.expireOverdueResolutionWindowChoices();

    const filters = {
      userId: query.userId,
      companyId: query.companyId,
      status: query.status,
      categoryId: query.categoryId,
      search: query.search,
      page: query.page,
      limit: query.limit,
    };

    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findMany(filters),
      this.reviewsRepository.count(filters),
    ]);

    return {
      data: mapReviewsPublic(reviews, {
        includeUnpublishedReply: true,
        includeReviewerContact: true,
      }),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async proceedResolution(user: AuthenticatedUser, reviewId: string): Promise<ReviewPublic> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== user.id) {
      throw new ForbiddenException('Only the reviewer can proceed with this review');
    }

    if (review.status !== 'RESOLUTION_PENDING') {
      throw new BadRequestException('This review is not awaiting your resolution decision');
    }

    this.assertResolutionDeadlinePassed(review);

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status: 'PROCEEDED',
      moderationScore: review.moderationScore,
    });

    await this.reviewsRepository.createModerationLog({
      reviewId,
      reason: `resolution_proceeded_by_reviewer:${user.id}`,
      score: review.moderationScore,
      action: ModerationAction.RESOLUTION_PROCEEDED,
    });

    const companyName = review.company?.name ?? 'Company';
    const companyEmail = resolveCompanyOwnerEmail(review);
    await this.emailService.sendReviewResolutionDecisionToCompanyEmail({
      companyEmail,
      companyName,
      reviewTitle: review.title,
      decision: 'proceeded',
    });

    const updated = await this.reviewsRepository.findById(reviewId);
    return toReviewPublic(updated!);
  }

  async withdrawResolution(user: AuthenticatedUser, reviewId: string): Promise<ReviewPublic> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== user.id) {
      throw new ForbiddenException('Only the reviewer can withdraw this review');
    }

    if (review.status !== 'RESOLUTION_PENDING') {
      throw new BadRequestException('This review is not awaiting your resolution decision');
    }

    this.assertResolutionWindowStarted(review);

    await this.reviewsRepository.updateModerationResult(reviewId, {
      status: 'WITHDRAWN',
      moderationScore: review.moderationScore,
    });

    await this.reviewsRepository.createModerationLog({
      reviewId,
      reason: `resolution_withdrawn_by_reviewer:${user.id}`,
      score: review.moderationScore,
      action: ModerationAction.RESOLUTION_WITHDRAWN,
    });

    const companyName = review.company?.name ?? 'Company';
    const reviewer = resolveReviewerContact(review);
    const companyEmail = resolveCompanyOwnerEmail(review);

    await this.emailService.sendReviewWithdrawnEmails({
      reviewerEmail: reviewer.email,
      companyEmail,
      companyName,
      reviewTitle: review.title,
    });

    const updated = await this.reviewsRepository.findById(reviewId);
    return toReviewPublic(updated!);
  }

  async modifyResolution(
    user: AuthenticatedUser,
    reviewId: string,
    dto: ModifyResolutionDto,
  ): Promise<ReviewPublic> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== user.id) {
      throw new ForbiddenException('Only the reviewer can modify this review');
    }

    if (review.status !== 'RESOLUTION_PENDING') {
      throw new BadRequestException('This review is not in the resolution process');
    }

    this.assertResolutionWindowStarted(review);

    const normalizedTitle = dto.title.trim().replace(/\s+/g, ' ');
    const normalizedContent = dto.content.trim().replace(/\s+/g, ' ');
    if (normalizedTitle.length < 3 || normalizedContent.length < 20) {
      throw new BadRequestException('Review title or content is too short');
    }

    await this.reviewsRepository.updateReviewContent(reviewId, {
      rating: dto.rating,
      title: normalizedTitle,
      content: normalizedContent,
      status: 'MODIFIED',
    });

    await this.reviewsRepository.createModerationLog({
      reviewId,
      reason: `resolution_modified_by_reviewer:${user.id}`,
      score: review.moderationScore,
      action: ModerationAction.RESOLUTION_MODIFIED,
    });

    const companyName = review.company?.name ?? 'Company';
    const companyEmail = resolveCompanyOwnerEmail(review);
    await this.emailService.sendReviewResolutionDecisionToCompanyEmail({
      companyEmail,
      companyName,
      reviewTitle: normalizedTitle,
      decision: 'modified',
    });

    const updated = await this.reviewsRepository.findById(reviewId);
    return toReviewPublic(updated!);
  }

  async setResolutionWindow(
    user: AuthenticatedUser,
    reviewId: string,
    dto: SetResolutionWindowDto,
  ): Promise<ReviewPublic> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== 'RESOLUTION_PENDING') {
      throw new BadRequestException('Only reviews awaiting resolution can have a window set');
    }

    if (review.resolutionDeadlineAt) {
      throw new BadRequestException('Resolution window has already been set for this review');
    }

    const company = await this.companiesRepository.findById(review.companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the company owner can set the resolution window');
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + dto.days);

    await this.reviewsRepository.updateResolutionWindow(reviewId, {
      resolutionWindowDays: dto.days,
      resolutionDeadlineAt: deadline,
    });

    try {
      const job = await this.moderationQueue.getJob(`resolution-choice-${reviewId}`);
      if (job) await job.remove();
    } catch {
      // ignore — timeout job may already be gone
    }

    const updated = await this.reviewsRepository.findById(reviewId);
    return toReviewPublic(updated!);
  }

  async replyToReview(
    user: AuthenticatedUser,
    reviewId: string,
    dto: CreateReviewReplyDto,
  ): Promise<ReviewPublic> {
    const review = await this.reviewsRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const company = await this.companiesRepository.findById(review.companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the company owner can reply to reviews');
    }

    if (review.status !== 'APPROVED') {
      throw new ForbiddenException('Can only reply to approved reviews');
    }

    const existingReply = await this.reviewsRepository.findReplyByReviewId(reviewId);
    const content = dto.content.trim();

    if (existingReply?.status === 'APPROVED') {
      throw new ConflictException('A reply already exists for this review');
    }

    if (existingReply?.status === 'PENDING') {
      throw new ConflictException('Your reply is already pending admin review');
    }

    if (existingReply) {
      await this.reviewsRepository.updateReplyContent(reviewId, content);
    } else {
      await this.reviewsRepository.createReply(reviewId, review.companyId, content);
    }

    const updated = await this.reviewsRepository.findById(reviewId);

    return toReviewPublic(updated!, { includeUnpublishedReply: true });
  }

  async getReviewerDashboard(userId: string): Promise<ReviewerDashboard> {
    const [statusGroups, dailyActivity, recentlyRatedCompanies, latestReviews] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),
      this.getReviewerDailyAnalytics(userId),
      this.getRecentlyRatedCompanies(userId),
      this.reviewsRepository.findByUserId(userId, { page: 1, limit: 8 }),
    ]);

    const statusMap = Object.fromEntries(
      statusGroups.map((group) => [group.status, group._count.id]),
    );

    const pendingReviews =
      (statusMap.PENDING ?? 0) +
      (statusMap.RESOLUTION_PENDING ?? 0) +
      (statusMap.MODIFIED ?? 0) +
      (statusMap.PROCEEDED ?? 0);

    return {
      stats: {
        totalReviews: Object.values(statusMap).reduce((sum, count) => sum + count, 0),
        pendingReviews,
        approvedReviews: statusMap.APPROVED ?? 0,
        rejectedReviews: statusMap.REJECTED ?? 0,
      },
      dailyActivity,
      recentlyRatedCompanies,
      latestReviews: latestReviews.map((review) => toReviewPublic(review)),
    };
  }

  private async getReviewerDailyAnalytics(userId: string) {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - 6);

    const [reviews, pageViews] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId, createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      this.prisma.companyPageView.findMany({
        where: { userId, viewedAt: { gte: rangeStart } },
        select: { viewedAt: true },
      }),
    ]);

    const buckets = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(rangeStart);
      dayStart.setDate(dayStart.getDate() + index);

      return {
        date: dayStart.toISOString().slice(0, 10),
        reviewCount: 0,
        pageVisits: 0,
      };
    });

    for (const review of reviews) {
      const dayIndex = Math.floor(
        (review.createdAt.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (dayIndex < 0 || dayIndex >= buckets.length) continue;

      const bucket = buckets[dayIndex];
      if (!bucket) continue;

      bucket.reviewCount += 1;
    }

    for (const view of pageViews) {
      const dayIndex = Math.floor(
        (view.viewedAt.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (dayIndex < 0 || dayIndex >= buckets.length) continue;

      const bucket = buckets[dayIndex];
      if (!bucket) continue;

      bucket.pageVisits += 1;
    }

    return buckets.map(({ date, reviewCount, pageVisits }) => ({
      date,
      reviewCount,
      pageVisits,
    }));
  }

  private async getRecentlyRatedCompanies(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        company: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
    });

    const seen = new Set<string>();
    const companies = [];

    for (const review of reviews) {
      if (seen.has(review.companyId)) continue;

      seen.add(review.companyId);
      companies.push({
        id: review.company.id,
        name: review.company.name,
        slug: review.company.slug,
        logo: review.company.logo,
        rating: review.rating,
        reviewedAt: review.createdAt.toISOString(),
      });

      if (companies.length >= 5) break;
    }

    return companies;
  }

  private assertResolutionDeadlinePassed(review: { resolutionDeadlineAt: Date | null }): void {
    if (!review.resolutionDeadlineAt) {
      throw new BadRequestException('The company has not set a resolution window yet');
    }

    if (new Date() < review.resolutionDeadlineAt) {
      throw new BadRequestException('The resolution window has not ended yet');
    }
  }

  /** Edit/withdraw allowed once the company has set a window (during or after the deadline). */
  private assertResolutionWindowStarted(review: { resolutionDeadlineAt: Date | null }): void {
    if (!review.resolutionDeadlineAt) {
      throw new BadRequestException('The company has not set a resolution window yet');
    }
  }

  private extractClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim();
    }

    if (Array.isArray(forwarded)) {
      return forwarded[0]?.split(',')[0]?.trim();
    }

    return request.ip;
  }
}
