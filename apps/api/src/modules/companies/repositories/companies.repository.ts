import { Injectable } from '@nestjs/common';
import type { Company, CompanyVerificationStatus, Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';
import type { CompanySortOption } from '../dto/search-companies-query.dto';

export interface SearchCompaniesFilters {
  query?: string;
  country?: string;
  city?: string;
  categoryId?: string;
  minRating?: number;
  sort?: CompanySortOption;
  page: number;
  limit: number;
}

export interface CompanyReviewStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
}

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
      include: {
        owner: { select: { email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: { select: { email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  findByOwnerId(ownerId: string) {
    return this.prisma.company.findUnique({
      where: { ownerId },
      include: {
        owner: { select: { email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  slugExists(slug: string, excludeId?: string): Promise<boolean> {
    return this.prisma.company
      .findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      })
      .then((company) => company !== null);
  }

  create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({ data });
  }

  update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data });
  }

  delete(id: string): Promise<Company> {
    return this.prisma.company.delete({ where: { id } });
  }

  findMany(filters: SearchCompaniesFilters): Promise<Company[]> {
    const where = this.buildWhereClause(filters);

    return this.prisma.company.findMany({
      where,
      skip: paginationSkip(filters.page, filters.limit),
      take: filters.limit,
      orderBy: this.buildOrderBy(filters.sort),
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  count(filters: Omit<SearchCompaniesFilters, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause({ ...filters, page: 1, limit: 1 });
    return this.prisma.company.count({ where });
  }

  findManyForAdminVerification(input: {
    status?: CompanyVerificationStatus;
    page: number;
    limit: number;
  }) {
    const where: Prisma.CompanyWhereInput = input.status
      ? { verificationStatus: input.status }
      : {};

    return this.prisma.company.findMany({
      where,
      skip: paginationSkip(input.page, input.limit),
      take: input.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, email: true } },
      },
    });
  }

  countForAdminVerification(status?: CompanyVerificationStatus): Promise<number> {
    const where: Prisma.CompanyWhereInput = status ? { verificationStatus: status } : {};
    return this.prisma.company.count({ where });
  }

  findByIdWithOwner(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true } },
      },
    });
  }

  getReviewStats(companyId: string): Promise<CompanyReviewStats> {
    return this.prisma.review
      .groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      })
      .then((groups) => {
        const stats: CompanyReviewStats = {
          totalReviews: 0,
          pendingReviews: 0,
          approvedReviews: 0,
          rejectedReviews: 0,
        };

        for (const group of groups) {
          const count = group._count.status;
          stats.totalReviews += count;

          switch (group.status as ReviewStatus) {
            case 'PENDING':
              stats.pendingReviews = count;
              break;
            case 'APPROVED':
              stats.approvedReviews = count;
              break;
            case 'REJECTED':
              stats.rejectedReviews = count;
              break;
          }
        }

        return stats;
      });
  }

  private buildWhereClause(filters: SearchCompaniesFilters): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = {
      verificationStatus: 'APPROVED',
    };

    if (filters.country) {
      where.country = { equals: filters.country, mode: 'insensitive' };
    }

    if (filters.city) {
      where.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters.minRating !== undefined) {
      where.ratingAverage = { gte: filters.minRating };
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sort?: CompanySortOption,
  ): Prisma.CompanyOrderByWithRelationInput | Prisma.CompanyOrderByWithRelationInput[] {
    switch (sort) {
      case 'reviews':
        return { reviewCount: 'desc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'name':
        return { name: 'asc' };
      case 'rating':
      default:
        return [{ ratingAverage: 'desc' }, { reviewCount: 'desc' }];
    }
  }
}
