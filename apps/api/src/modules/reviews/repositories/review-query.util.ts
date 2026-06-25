import type { Prisma, ReviewStatus } from '@prisma/client';

export interface ListReviewsFilters {
  userId?: string;
  companyId?: string;
  status?: ReviewStatus;
  categoryId?: string;
  search?: string;
  page: number;
  limit: number;
}

const reviewInclude = {
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      phoneVerified: true,
      createdAt: true,
      profile: { select: { fullName: true, avatarUrl: true, phone: true } },
    },
  },
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      categoryId: true,
      email: true,
      owner: { select: { id: true, email: true } },
      category: { select: { id: true, nameEn: true, nameAr: true } },
    },
  },
  replies: true,
  attachments: true,
  serviceRatings: {
    include: {
      companyCatalogItem: { select: { id: true, nameEn: true, nameAr: true } },
    },
  },
} satisfies Prisma.ReviewInclude;

export function buildReviewWhere(
  filters: Omit<ListReviewsFilters, 'page' | 'limit'>,
): Prisma.ReviewWhereInput {
  const search = filters.search?.trim();

  return {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.companyId ? { companyId: filters.companyId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categoryId
      ? {
          company: {
            categoryId: filters.categoryId,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { company: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { displayName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export { reviewInclude };
