import { Injectable } from '@nestjs/common';
import type { Company, CompanyVerificationStatus, Prisma, ReviewStatus } from '@prisma/client';
import type { ReviewRatingDistribution } from '@rateq/types';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';
import type { CompanySortOption } from '../dto/search-companies-query.dto';
import { EMPTY_RATING_DISTRIBUTION } from '../mappers/company.mapper';

export interface SearchCompaniesFilters {
  query?: string;
  country?: string;
  city?: string;
  categoryId?: string;
  subcategoryId?: string;
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

  private readonly companyInclude = {
    owner: { select: { id: true, email: true, isActive: true } },
    category: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
    projects: { orderBy: { sortOrder: 'asc' as const } },
  } satisfies Prisma.CompanyInclude;

  findBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
      include: this.companyInclude,
    });
  }

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: this.companyInclude,
    });
  }

  findByOwnerId(ownerId: string) {
    return this.prisma.company.findUnique({
      where: { ownerId },
      include: this.companyInclude,
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
        category: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
      },
    });
  }

  count(filters: Omit<SearchCompaniesFilters, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause({ ...filters, page: 1, limit: 1 });
    return this.prisma.company.count({ where });
  }

  findManyForAdminVerification(input: {
    status?: CompanyVerificationStatus | 'profile_changes';
    page: number;
    limit: number;
  }) {
    const where: Prisma.CompanyWhereInput =
      input.status === 'profile_changes'
        ? { profileChangeStatus: 'PENDING', verificationStatus: 'APPROVED' }
        : input.status
          ? { verificationStatus: input.status as CompanyVerificationStatus }
          : {};

    return this.prisma.company.findMany({
      where,
      skip: paginationSkip(input.page, input.limit),
      take: input.limit,
      orderBy: input.status === 'profile_changes' ? { updatedAt: 'desc' } : { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, email: true } },
        _count: { select: { pageViews: true } },
      },
    });
  }

  countForAdminVerification(
    status?: CompanyVerificationStatus | 'profile_changes',
  ): Promise<number> {
    const where: Prisma.CompanyWhereInput =
      status === 'profile_changes'
        ? { profileChangeStatus: 'PENDING', verificationStatus: 'APPROVED' }
        : status
          ? { verificationStatus: status as CompanyVerificationStatus }
          : {};
    return this.prisma.company.count({ where });
  }

  findByIdWithOwner(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true } },
        _count: { select: { pageViews: true } },
      },
    });
  }

  async getApprovedRatingDistribution(companyId: string): Promise<ReviewRatingDistribution> {
    const groups = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { companyId, status: 'APPROVED' },
      _count: { id: true },
    });

    const distribution: ReviewRatingDistribution = { ...EMPTY_RATING_DISTRIBUTION };

    for (const group of groups) {
      const rating = Math.min(5, Math.max(1, group.rating)) as keyof ReviewRatingDistribution;
      distribution[rating] = group._count.id;
    }

    return distribution;
  }

  replaceProjects(
    companyId: string,
    projects: {
      title: string;
      imageUrl: string;
      projectUrl?: string;
      slug?: string;
      description?: string;
      demoImages?: string[];
      clientName?: string;
      location?: string;
      projectDate?: string;
      serviceIds?: string[];
      customServices?: string[];
    }[],
    options?: { defaultStatus?: 'PENDING' | 'APPROVED' },
  ): Promise<void> {
    const defaultStatus = options?.defaultStatus ?? 'PENDING';
    const slugify = (title: string, index: number) => {
      const base =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'project';
      return `${base}-${index + 1}`.slice(0, 80);
    };

    return this.prisma.$transaction(async (tx) => {
      await tx.companyProject.deleteMany({ where: { companyId } });

      if (projects.length === 0) return;

      await tx.companyProject.createMany({
        data: projects.map((project, index) => ({
          companyId,
          slug: project.slug ?? slugify(project.title, index),
          title: project.title,
          description: project.description ?? null,
          imageUrl: project.imageUrl,
          projectUrl: project.projectUrl ?? '',
          demoImages: project.demoImages ?? [],
          clientName: project.clientName ?? null,
          location: project.location ?? null,
          projectDate: project.projectDate ? new Date(project.projectDate) : null,
          serviceIds: project.serviceIds ?? [],
          customServices: project.customServices ?? [],
          status: defaultStatus,
          sortOrder: index,
        })),
      });
    });
  }

  findProjectById(projectId: string) {
    return this.prisma.companyProject.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            owner: { select: { id: true, email: true } },
            email: true,
          },
        },
      },
    });
  }

  updateProjectStatus(projectId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.companyProject.update({
      where: { id: projectId },
      data: { status },
    });
  }

  deleteProjectById(projectId: string) {
    return this.prisma.companyProject.delete({ where: { id: projectId } });
  }

  findProjectsForModeration(filters: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    page: number;
    limit: number;
  }) {
    const where = filters.status ? { status: filters.status } : {};
    return this.prisma.companyProject.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            category: { select: { nameEn: true, nameAr: true } },
          },
        },
      },
    });
  }

  countProjectsForModeration(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.companyProject.count({
      where: status ? { status } : {},
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
    const andConditions: Prisma.CompanyWhereInput[] = [
      { verificationStatus: 'APPROVED' },
      { OR: [{ ownerId: null }, { owner: { isActive: true } }] },
    ];

    if (filters.country) {
      andConditions.push({ country: { equals: filters.country, mode: 'insensitive' } });
    }

    if (filters.city) {
      andConditions.push({ city: { equals: filters.city, mode: 'insensitive' } });
    }

    if (filters.minRating !== undefined) {
      andConditions.push({ ratingAverage: { gte: filters.minRating } });
    }

    if (filters.categoryId) {
      andConditions.push({
        OR: [
          { categoryId: filters.categoryId },
          { categoryIds: { array_contains: [filters.categoryId] } },
        ],
      });
    }

    if (filters.subcategoryId) {
      andConditions.push({
        subcategoryIds: { array_contains: [filters.subcategoryId] },
      });
    }

    if (filters.query) {
      andConditions.push({
        OR: [
          { name: { contains: filters.query, mode: 'insensitive' } },
          { description: { contains: filters.query, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: andConditions };
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
