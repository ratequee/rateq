import type { Category } from '@prisma/client';
import type { CategoryPublic } from '@rateq/types';

export function toCategoryPublic(
  category: Category & { _count?: { companies: number } },
): CategoryPublic {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    companyCount: category._count?.companies,
    createdAt: category.createdAt.toISOString(),
  };
}
