import type { Category, Company, User } from '@prisma/client';
import type { CompanyDetail, CompanyPublic } from '@rateq/types';

type CompanyWithPublicRelations = Company & {
  owner?: Pick<User, 'email'> | null;
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
};

export function toCompanyPublic(company: CompanyWithPublicRelations): CompanyPublic {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    logo: company.logo,
    coverUrl: company.coverUrl,
    email: company.email ?? company.owner?.email ?? null,
    phone: company.phone ?? null,
    country: company.country,
    city: company.city,
    ratingAverage: Number(company.ratingAverage),
    reviewCount: company.reviewCount,
    createdAt: company.createdAt.toISOString(),
    categoryId: company.categoryId ?? undefined,
    categoryName: company.category?.name ?? undefined,
  };
}

export function toCompanyDetail(company: CompanyWithPublicRelations): CompanyDetail {
  return {
    ...toCompanyPublic(company),
    updatedAt: company.updatedAt.toISOString(),
  };
}
