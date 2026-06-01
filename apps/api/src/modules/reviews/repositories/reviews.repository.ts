import { Injectable } from '@nestjs/common';
import type { Prisma, Review, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';

export interface ListReviewsFilters {
  companyId?: string;
  status?: ReviewStatus;
  page: number;
  limit: number;
}

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, createdAt: true, isVerified: true } },
        company: true,
        replies: true,
      },
    });
  }

  findByUserAndCompany(userId: string, companyId: string) {
    return this.prisma.review.findFirst({
      where: { userId, companyId },
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
  }): Promise<Review> {
    return this.prisma.review.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  findPending(page: number, limit: number) {
    return this.prisma.review.findMany({
      where: { status: 'PENDING' },
      skip: paginationSkip(page, limit),
      take: limit,
      orderBy: [{ moderationScore: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: { select: { id: true, email: true } },
        company: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  countPending(): Promise<number> {
    return this.prisma.review.count({ where: { status: 'PENDING' } });
  }

  findMany(filters: ListReviewsFilters) {
    const where: Prisma.ReviewWhereInput = {
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    return this.prisma.review.findMany({
      where,
      skip: paginationSkip(filters.page, filters.limit),
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        replies: true,
      },
    });
  }

  count(filters: Omit<ListReviewsFilters, 'page' | 'limit'>): Promise<number> {
    const where: Prisma.ReviewWhereInput = {
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    return this.prisma.review.count({ where });
  }

  findByUserId(userId: string, page: number, limit: number) {
    return this.prisma.review.findMany({
      where: { userId },
      skip: paginationSkip(page, limit),
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        replies: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  countByUserId(userId: string): Promise<number> {
    return this.prisma.review.count({ where: { userId } });
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

  createReply(reviewId: string, companyId: string, content: string) {
    return this.prisma.reviewReply.create({
      data: { reviewId, companyId, content },
    });
  }

  findReplyByReviewId(reviewId: string) {
    return this.prisma.reviewReply.findUnique({ where: { reviewId } });
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
}
