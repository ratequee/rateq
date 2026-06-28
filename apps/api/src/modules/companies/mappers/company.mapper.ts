import type { Category, Company, CompanyProject, User } from '@prisma/client';
import type {
  CompanyCatalogLabel,
  CompanyCategoryLabel,
  CompanyDetail,
  CompanyProjectPublic,
  CompanyPublic,
  CompanyServiceRatingAggregate,
  CompanySocialLinks,
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

function parseDemoImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, 8);
}

function resolveCategoryIds(company: Company): string[] {
  const fromJson = parseIds(company.categoryIds);
  if (fromJson.length > 0) return fromJson;
  return company.categoryId ? [company.categoryId] : [];
}

function toSocialLinks(company: Company): CompanySocialLinks {
  return {
    whatsappNumber: company.whatsappNumber ?? null,
    instagramUrl: company.instagramUrl ?? null,
    youtubeUrl: company.youtubeUrl ?? null,
    facebookUrl: company.facebookUrl ?? null,
    linkedinUrl: company.linkedinUrl ?? null,
    twitterUrl: company.twitterUrl ?? null,
  };
}

function toCompanyProjectPublic(project: CompanyProject): CompanyProjectPublic {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description ?? null,
    imageUrl: project.imageUrl,
    projectUrl: project.projectUrl,
    demoImages: parseDemoImages(project.demoImages),
    clientName: project.clientName ?? null,
    location: project.location ?? null,
    projectDate: project.projectDate?.toISOString() ?? null,
    serviceIds: parseIds(project.serviceIds),
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
    categoryItems?: CompanyCategoryLabel[];
    serviceRatingAggregates?: CompanyServiceRatingAggregate[];
  },
): CompanyPublic {
  const categoryIds = resolveCategoryIds(company);

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
    socialLinks: toSocialLinks(company),
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
    categoryId: categoryIds[0] ?? company.categoryId ?? undefined,
    categoryIds,
    categoryItems: extras?.categoryItems ?? [],
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
    categoryItems?: CompanyCategoryLabel[];
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

export function normalizeCategoryIdsInput(categoryIds?: string[], categoryId?: string): string[] {
  const ids = categoryIds?.filter(Boolean) ?? [];
  if (ids.length > 0) return [...new Set(ids)];
  return categoryId ? [categoryId] : [];
}
