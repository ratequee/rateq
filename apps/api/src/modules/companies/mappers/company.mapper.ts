import type { Company } from '@prisma/client';
import type { CompanyDetail, CompanyPublic } from '@rateq/types';

export function toCompanyPublic(company: Company): CompanyPublic {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    logo: company.logo,
    country: company.country,
    city: company.city,
    ratingAverage: Number(company.ratingAverage),
    reviewCount: company.reviewCount,
    createdAt: company.createdAt.toISOString(),
  };
}

export function toCompanyDetail(company: Company): CompanyDetail {
  return {
    ...toCompanyPublic(company),
    updatedAt: company.updatedAt.toISOString(),
  };
}
