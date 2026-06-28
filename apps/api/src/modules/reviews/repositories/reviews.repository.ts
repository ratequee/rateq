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

  findActiveByUserAndCompany(userId: string, companyId: string) {
    return this.prisma.review.findFirst({
      where: {
        userId,
        companyId,
        status: { in: ['PENDING', 'RESOLUTION_PENDING', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
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
    },
  ): Promise<Review> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: data.status,
        moderationScore: data.moderationScore,
        similarityScore: data.similarityScore,
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

  createReply(reviewId: string, companyId: string, content: string) {
    return this.prisma.reviewReply.create({
      data: { reviewId, companyId, content, status: 'PENDING' },
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
