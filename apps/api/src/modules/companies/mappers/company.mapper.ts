import type { Category, Company, CompanyProject, User } from '@prisma/client';
import type {
  CompanyDetail,
  CompanyProjectPublic,
  CompanyPublic,
  ReviewRatingDistribution,
} from '@rateq/types';

type CompanyWithPublicRelations = Company & {
  owner?: Pick<User, 'email'> | null;
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
  projects?: CompanyProject[];
};

export const EMPTY_RATING_DISTRIBUTION: ReviewRatingDistribution = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

function parseServices(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function toCompanyProjectPublic(project: CompanyProject): CompanyProjectPublic {
  return {
    id: project.id,
    title: project.title,
    imageUrl: project.imageUrl,
    projectUrl: project.projectUrl,
    sortOrder: project.sortOrder,
  };
}

export function toCompanyPublic(
  company: CompanyWithPublicRelations,
  extras?: { ratingDistribution?: ReviewRatingDistribution },
): CompanyPublic {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    logo: company.logo,
    coverUrl: company.coverUrl,
    email: company.email ?? company.owner?.email ?? null,
    phone: company.phone ?? null,
    websiteUrl: company.websiteUrl ?? null,
    services: parseServices(company.services),
    projects: (company.projects ?? []).map(toCompanyProjectPublic),
    country: company.country,
    city: company.city,
    ratingAverage: Number(company.ratingAverage),
    reviewCount: company.reviewCount,
    ratingDistribution: extras?.ratingDistribution ?? EMPTY_RATING_DISTRIBUTION,
    createdAt: company.createdAt.toISOString(),
    categoryId: company.categoryId ?? undefined,
    categoryName: company.category?.name ?? undefined,
    latitude: company.latitude ?? null,
    longitude: company.longitude ?? null,
  };
}

export function toCompanyDetail(
  company: CompanyWithPublicRelations,
  extras?: { ratingDistribution?: ReviewRatingDistribution },
): CompanyDetail {
  return {
    ...toCompanyPublic(company, extras),
    updatedAt: company.updatedAt.toISOString(),
  };
}
