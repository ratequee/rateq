import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  AuthenticatedUser,
  CreateReviewInput,
  PaginatedReviewsResponse,
  ReviewPublic,
} from '@rateq/types';
import { ReviewStatus, UserRole } from '@rateq/types';
import { hashIp } from '../../common/utils/ip-hash.util';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/env.validation';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { CompaniesRepository } from '../companies/repositories/companies.repository';
import { ReviewsRepository } from './repositories/reviews.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { REVIEW_MODERATION_QUEUE } from '../../infrastructure/queue/queue.constants';
import type { ReviewModerationJobPayload } from '../moderation/processors/review-moderation.processor';
import { ReviewRateLimitService } from './services/review-rate-limit.service';
import { toReviewPublic } from './mappers/review.mapper';
import type { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import type { CreateReviewReplyDto } from './dto/create-reply.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly companiesRepository: CompaniesRepository,
    @InjectQueue(REVIEW_MODERATION_QUEUE)
    private readonly moderationQueue: Queue<ReviewModerationJobPayload>,
    private readonly rateLimitService: ReviewRateLimitService,
    private readonly configService: ConfigService<AppConfig, true>,
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

    if (company.ownerId === user.id) {
      throw new ForbiddenException('You cannot review your own company');
    }

    const existing = await this.reviewsRepository.findByUserAndCompany(user.id, input.companyId);

    if (existing) {
      throw new ConflictException('You have already reviewed this company');
    }

    await this.rateLimitService.assertWithinLimit(user.id);

    const clientIp = this.extractClientIp(request);
    const ipSecret = this.configService.get('IP_HASH_SECRET', { infer: true });
    const hashedIp = clientIp ? hashIp(clientIp, ipSecret) : undefined;

    const review = await this.reviewsRepository.create({
      userId: user.id,
      companyId: input.companyId,
      rating: input.rating,
      title: input.title.trim(),
      content: input.content.trim(),
      hashedIp,
      deviceFingerprint: input.deviceFingerprint,
    });

    await this.moderationQueue.add(
      'process-review',
      { reviewId: review.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    const full = await this.reviewsRepository.findById(review.id);

    return toReviewPublic(full!);
  }

  async listByCompany(
    companyId: string,
    query: ListReviewsQueryDto,
  ): Promise<PaginatedReviewsResponse> {
    return this.listCompanyReviews(companyId, query, ReviewStatus.APPROVED);
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

    return this.listCompanyReviews(companyId, query, query.status);
  }

  private async listCompanyReviews(
    companyId: string,
    query: ListReviewsQueryDto,
    status?: ReviewStatus,
  ): Promise<PaginatedReviewsResponse> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const filters = {
      companyId,
      status,
      page: query.page,
      limit: query.limit,
    };

    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findMany(filters),
      this.reviewsRepository.count(filters),
    ]);

    return {
      data: reviews.map(toReviewPublic),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listMyReviews(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedReviewsResponse> {
    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findByUserId(userId, page, limit),
      this.reviewsRepository.countByUserId(userId),
    ]);

    return {
      data: reviews.map(toReviewPublic),
      meta: buildPaginationMeta(page, limit, total),
    };
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

    if (existingReply) {
      throw new ConflictException('A reply already exists for this review');
    }

    await this.reviewsRepository.createReply(reviewId, review.companyId, dto.content.trim());

    const updated = await this.reviewsRepository.findById(reviewId);

    return toReviewPublic(updated!);
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
