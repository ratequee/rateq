import type { Category, Company, CompanyProject, User } from '@prisma/client';
import type {
  CompanyCatalogLabel,
  CompanyDetail,
  CompanyProjectPublic,
  CompanyPublic,
  CompanyServiceRatingAggregate,
  ReviewRatingDistribution,
} from '@rateq/types';

type CompanyWithPublicRelations = Company & {
  owner?: Pick<User, 'email'> | null;
  category?: Pick<Category, 'id' | 'nameEn' | 'nameAr' | 'slug'> | null;
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

function parseIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
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

function resolveDescription(company: Company): string | null {
  return company.descriptionEn ?? company.description ?? null;
}

export function toCompanyPublic(
  company: CompanyWithPublicRelations,
  extras?: {
    ratingDistribution?: ReviewRatingDistribution;
    serviceItems?: CompanyCatalogLabel[];
    activityItems?: CompanyCatalogLabel[];
    serviceRatingAggregates?: CompanyServiceRatingAggregate[];
  },
): CompanyPublic {
  return {
    id: company.id,
    name: company.name,
    nameAr: company.nameAr,
    slug: company.slug,
    description: resolveDescription(company),
    descriptionEn: company.descriptionEn ?? company.description ?? null,
    descriptionAr: company.descriptionAr,
    logo: company.logo,
    coverUrl: company.coverUrl,
    email: company.email ?? company.owner?.email ?? null,
    phone: company.phone ?? null,
    websiteUrl: company.websiteUrl ?? null,
    services: parseServices(company.services),
    serviceItems: extras?.serviceItems ?? [],
    activityItems: extras?.activityItems ?? [],
    serviceRatingAggregates: extras?.serviceRatingAggregates ?? [],
    yearsEstablished: company.yearsEstablished,
    publicProjectCount: company.publicProjectCount,
    privateProjectCount: company.privateProjectCount,
    projects: (company.projects ?? []).map(toCompanyProjectPublic),
    country: company.country,
    city: company.city,
    ratingAverage: Number(company.ratingAverage),
    reviewCount: company.reviewCount,
    ratingDistribution: extras?.ratingDistribution ?? EMPTY_RATING_DISTRIBUTION,
    createdAt: company.createdAt.toISOString(),
    categoryId: company.categoryId ?? undefined,
    categoryName: company.category?.nameEn ?? undefined,
    categoryNameAr: company.category?.nameAr ?? undefined,
    latitude: company.latitude ?? null,
    longitude: company.longitude ?? null,
  };
}

export function toCompanyDetail(
  company: CompanyWithPublicRelations,
  extras?: {
    ratingDistribution?: ReviewRatingDistribution;
    serviceItems?: CompanyCatalogLabel[];
    activityItems?: CompanyCatalogLabel[];
  },
): CompanyDetail {
  return {
    ...toCompanyPublic(company, extras),
    updatedAt: company.updatedAt.toISOString(),
    profileChangeStatus: company.profileChangeStatus === 'PENDING' ? 'pending' : 'none',
  };
}

export function parseCompanyIdList(value: unknown): string[] {
  return parseIds(value);
}
