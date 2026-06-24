import type { Category, CategoryService } from '@prisma/client';
import type { CategoryPublic } from '@rateq/types';
import { toCategoryServicePublic } from './category-service.mapper';

export function toCategoryPublic(
  category: Category & {
    _count?: { companies: number };
    services?: CategoryService[];
  },
): CategoryPublic {
  return {
    id: category.id,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    slug: category.slug,
    companyCount: category._count?.companies,
    services: category.services?.map(toCategoryServicePublic),
    createdAt: category.createdAt.toISOString(),
  };
}
