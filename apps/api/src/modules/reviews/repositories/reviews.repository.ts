import { Injectable } from '@nestjs/common';
import type { Review, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';
import { buildReviewWhere, reviewInclude, type ListReviewsFilters } from './review-query.util';

export type { ListReviewsFilters };

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });
  }

  findByUserAndCompany(userId: string, companyId: string) {
    return this.prisma.review.findFirst({
      where: { userId, companyId },
    });
  }

  findPublishedByUserAndCompany(userId: string, companyId: string) {
    return this.prisma.review.findFirst({
      where: { userId, companyId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  findInFlightReviewByUserAndCompany(userId: string, companyId: string) {
    return this.prisma.review.findFirst({
      where: {
        userId,
        companyId,
        status: { in: ['PENDING', 'RESOLUTION_PENDING', 'MODIFIED', 'PROCEEDED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUserAndCompany(userId: string, companyId: string) {
    const published = await this.findPublishedByUserAndCompany(userId, companyId);
    if (published) return published;
    return this.findInFlightReviewByUserAndCompany(userId, companyId);
  }

  create(data: {
    userId: string;
    companyId: string;
    rating: number;
    title: string;
    content: string;
    hashedIp?: string;
    deviceFingerprint?: string;
    serviceRatings?: { companyCatalogItemId: string; rating: number }[];
    proofUrls?: string[];
  }): Promise<Review> {
    const { serviceRatings, proofUrls, ...reviewData } = data;

    return this.prisma.review.create({
      data: {
        ...reviewData,
        status: 'PENDING',
        ...(serviceRatings?.length
          ? {
              serviceRatings: {
                create: serviceRatings.map((entry) => ({
                  companyCatalogItemId: entry.companyCatalogItemId,
                  rating: entry.rating,
                })),
              },
            }
          : {}),
        ...(proofUrls?.length
          ? {
              attachments: {
                create: proofUrls.map((url) => ({ url })),
              },
            }
          : {}),
      },
    });
  }

  findMany(filters: ListReviewsFilters) {
    return this.prisma.review.findMany({
      where: buildReviewWhere(filters),
      skip: paginationSkip(filters.page, filters.limit),
      take: filters.limit,
      orderBy: [{ createdAt: 'desc' }],
      include: reviewInclude,
    });
  }

  count(filters: Omit<ListReviewsFilters, 'page' | 'limit'>): Promise<number> {
    return this.prisma.review.count({ where: buildReviewWhere(filters) });
  }

  findByUserId(userId: string, filters: Omit<ListReviewsFilters, 'userId'>) {
    return this.findMany({ ...filters, userId });
  }

  countByUserId(userId: string, filters: Omit<ListReviewsFilters, 'userId' | 'page' | 'limit'>) {
    return this.count({ ...filters, userId });
  }

  findRecentByCompany(companyId: string, since: Date, excludeReviewId?: string) {
    return this.prisma.review.findMany({
      where: {
        companyId,
        createdAt: { gte: since },
        ...(excludeReviewId ? { id: { not: excludeReviewId } } : {}),
      },
      select: { id: true, content: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  countUserReviewsSince(userId: string, since: Date): Promise<number> {
    return this.prisma.review.count({
      where: { userId, createdAt: { gte: since } },
    });
  }

  countReviewsOnCompanySince(
    companyId: string,
    since: Date,
    excludeReviewId?: string,
  ): Promise<number> {
    return this.prisma.review.count({
      where: {
        companyId,
        createdAt: { gte: since },
        ...(excludeReviewId ? { id: { not: excludeReviewId } } : {}),
      },
    });
  }

  countByHashedIpOnCompany(
    companyId: string,
    hashedIp: string,
    since: Date,
    excludeReviewId?: string,
  ): Promise<number> {
    return this.prisma.review.count({
      where: {
        companyId,
        hashedIp,
        createdAt: { gte: since },
        ...(excludeReviewId ? { id: { not: excludeReviewId } } : {}),
      },
    });
  }

  countByFingerprintOnCompany(
    companyId: string,
    fingerprint: string,
    since: Date,
    excludeReviewId?: string,
  ): Promise<number> {
    return this.prisma.review.count({
      where: {
        companyId,
        deviceFingerprint: fingerprint,
        createdAt: { gte: since },
        ...(excludeReviewId ? { id: { not: excludeReviewId } } : {}),
      },
    });
  }

  updateModerationResult(
    reviewId: string,
    data: {
      status: ReviewStatus;
      moderationScore: number;
      similarityScore?: number;
      resolutionRequestedAt?: Date | null;
      resolutionWindowDays?: number | null;
      resolutionDeadlineAt?: Date | null;
      incrementResolutionSentCount?: boolean;
    },
  ): Promise<Review> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: data.status,
        moderationScore: data.moderationScore,
        similarityScore: data.similarityScore,
        ...(data.resolutionRequestedAt !== undefined && {
          resolutionRequestedAt: data.resolutionRequestedAt,
        }),
        ...(data.resolutionWindowDays !== undefined && {
          resolutionWindowDays: data.resolutionWindowDays,
        }),
        ...(data.resolutionDeadlineAt !== undefined && {
          resolutionDeadlineAt: data.resolutionDeadlineAt,
        }),
        ...(data.incrementResolutionSentCount ? { resolutionSentCount: { increment: 1 } } : {}),
      },
    });
  }

  updateResolutionWindow(
    reviewId: string,
    data: { resolutionWindowDays: number; resolutionDeadlineAt: Date },
  ): Promise<Review> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        resolutionWindowDays: data.resolutionWindowDays,
        resolutionDeadlineAt: data.resolutionDeadlineAt,
      },
    });
  }

  /** Return reviews to PENDING when company never chose 7/14 days within 24h. */
  async expireOverdueResolutionWindowChoices(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.review.updateMany({
      where: {
        status: 'RESOLUTION_PENDING',
        resolutionDeadlineAt: null,
        OR: [
          { resolutionRequestedAt: { lte: cutoff } },
          { resolutionRequestedAt: null, updatedAt: { lte: cutoff } },
        ],
      },
      data: {
        status: 'PENDING',
        resolutionRequestedAt: null,
        resolutionWindowDays: null,
        resolutionDeadlineAt: null,
      },
    });
    return result.count;
  }

  updateReviewContent(
    reviewId: string,
    data: {
      rating: number;
      title: string;
      content: string;
      status: ReviewStatus;
    },
  ): Promise<Review> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        content: data.content,
        status: data.status,
      },
    });
  }

  async findRandomApprovedByCompany(companyId: string) {
    const where = { companyId, status: 'APPROVED' as const };
    const count = await this.prisma.review.count({ where });
    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    return this.prisma.review.findFirst({
      where,
      skip,
      take: 1,
      orderBy: { id: 'asc' },
      include: reviewInclude,
    });
  }

  createReply(reviewId: string, companyId: string, content: string) {
    return this.prisma.reviewReply.create({
      data: { reviewId, companyId, content, status: 'PENDING' },
    });
  }

  updateReplyContent(reviewId: string, content: string) {
    return this.prisma.reviewReply.update({
      where: { reviewId },
      data: { content, status: 'PENDING' },
    });
  }

  updateReplyStatus(reviewId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.reviewReply.update({
      where: { reviewId },
      data: { status },
    });
  }

  findReplyByReviewId(reviewId: string) {
    return this.prisma.reviewReply.findUnique({ where: { reviewId } });
  }

  deleteReply(reviewId: string): Promise<void> {
    return this.prisma.reviewReply.delete({ where: { reviewId } }).then(() => undefined);
  }

  deleteById(id: string): Promise<Review> {
    return this.prisma.review.delete({ where: { id } });
  }

  recalculateCompanyRating(companyId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const aggregate = await tx.review.aggregate({
        where: { companyId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { id: true },
      });

      const ratingAverage = aggregate._avg.rating ?? 0;
      const reviewCount = aggregate._count.id;

      await tx.company.update({
        where: { id: companyId },
        data: {
          ratingAverage,
          reviewCount,
        },
      });
    });
  }

  incrementUserReviewCount(userId: string): Promise<void> {
    return this.prisma.user
      .update({
        where: { id: userId },
        data: { reviewCount: { increment: 1 } },
      })
      .then(() => undefined);
  }

  decrementUserReviewCount(userId: string): Promise<void> {
    return this.prisma.user
      .update({
        where: { id: userId },
        data: { reviewCount: { decrement: 1 } },
      })
      .then(() => undefined);
  }

  createModerationLog(data: {
    reviewId: string;
    reason: string;
    score: number;
    action: import('@prisma/client').ModerationAction;
  }) {
    return this.prisma.moderationLog.create({ data });
  }
}
