import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminCompanyDetail,
  AdminCompanyListItem,
  AdminPlatformStats,
  AdminUserDetail,
  PaginatedCompaniesResponse,
  UserProfile,
} from '@rateq/types';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { CompaniesRepository } from '../companies/repositories/companies.repository';
import { toCompanyPublic } from '../companies/mappers/company.mapper';
import { ReviewsRepository } from '../reviews/repositories/reviews.repository';
import { toReviewPublic } from '../reviews/mappers/review.mapper';
import { UsersRepository } from '../users/repositories/users.repository';
import { toUserProfile } from '../users/mappers/user.mapper';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly reviewsRepository: ReviewsRepository,
  ) {}

  async getPlatformStats(): Promise<AdminPlatformStats> {
    const [
      totalCompanies,
      totalReviewers,
      statusGroups,
      topCompanies,
      topReviewers,
      latestReviews,
      dailyActivity,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count({ where: { role: 'USER', profile: { isNot: null } } }),
      this.prisma.review.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.company.findMany({
        orderBy: [{ reviewCount: 'desc' }, { ratingAverage: 'desc' }],
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          reviewCount: true,
          ratingAverage: true,
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { reviewCount: 'desc' },
        take: 5,
        include: { profile: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.reviewsRepository.findMany({ page: 1, limit: 8 }),
      this.getDailyActivityLast7Days(),
    ]);

    const statusMap = Object.fromEntries(
      statusGroups.map((group) => [group.status, group._count.id]),
    );

    return {
      totalCompanies,
      totalReviewers,
      totalReviews: Object.values(statusMap).reduce((sum, count) => sum + count, 0),
      pendingReviews: statusMap.PENDING ?? 0,
      approvedReviews: statusMap.APPROVED ?? 0,
      rejectedReviews: statusMap.REJECTED ?? 0,
      resolutionPendingReviews: statusMap.RESOLUTION_PENDING ?? 0,
      dailyActivity,
      topCompanies: topCompanies.map((company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo,
        reviewCount: company.reviewCount,
        ratingAverage: Number(company.ratingAverage),
      })),
      topReviewers: topReviewers.map((user) => ({
        id: user.id,
        name: user.profile?.fullName ?? user.displayName ?? user.email,
        email: user.email,
        reviewCount: user.reviewCount,
        avatarUrl: user.profile?.avatarUrl ?? null,
      })),
      latestReviews: latestReviews.map((review) => toReviewPublic(review)),
    };
  }

  async listCompanies(input: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedCompaniesResponse & { data: AdminCompanyListItem[] }> {
    const search = input.search?.trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, email: true, isActive: true } },
          category: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
          projects: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { pageViews: true } },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies.map((company) => ({
        ...toCompanyPublic(company),
        verificationStatus: company.verificationStatus.toLowerCase(),
        ownerEmail: company.owner?.email ?? company.email ?? null,
        ownerId: company.ownerId ?? null,
        ownerIsActive: company.owner?.isActive ?? null,
        pageVisitCount: company._count.pageViews,
      })),
      meta: buildPaginationMeta(input.page, input.limit, total),
    };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reviews = await this.reviewsRepository.findByUserId(userId, { page: 1, limit: 50 });

    return {
      ...toUserProfile(user),
      reviews: reviews.map((review) => toReviewPublic(review, { includeUnpublishedReply: true })),
    };
  }

  async getCompanyDetail(companyId: string): Promise<AdminCompanyDetail> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const [reviews, pageVisitCount] = await Promise.all([
      this.reviewsRepository.findMany({
        companyId,
        page: 1,
        limit: 50,
      }),
      this.prisma.companyPageView.count({ where: { companyId } }),
    ]);

    return {
      ...toCompanyPublic(company),
      verificationStatus: company.verificationStatus.toLowerCase(),
      ownerEmail: company.owner?.email ?? company.email ?? null,
      ownerId: company.ownerId ?? null,
      ownerIsActive: company.owner?.isActive ?? null,
      pageVisitCount,
      reviews: reviews.map((review) => toReviewPublic(review, { includeUnpublishedReply: true })),
    };
  }

  private async getDailyActivityLast7Days() {
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - 6);

    const reviews = await this.prisma.review.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true, companyId: true, userId: true },
    });

    const buckets = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(rangeStart);
      dayStart.setDate(dayStart.getDate() + index);

      return {
        date: dayStart.toISOString().slice(0, 10),
        reviewCount: 0,
        companyIds: new Set<string>(),
        userIds: new Set<string>(),
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
      bucket.companyIds.add(review.companyId);
      bucket.userIds.add(review.userId);
    }

    return buckets.map(({ date, reviewCount, companyIds, userIds }) => ({
      date,
      reviewCount,
      companiesCount: companyIds.size,
      reviewersCount: userIds.size,
    }));
  }

  async listTeamMembers(): Promise<UserProfile[]> {
    const admins = await this.usersRepository.findMany({
      role: 'ADMIN',
      page: 1,
      limit: 100,
    });

    return admins.map(toUserProfile);
  }
}
