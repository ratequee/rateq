import type { Category, CategoryService, CategorySubcategory } from '@prisma/client';
import type { CategoryPublic } from '@rateq/types';
import { toCategoryServicePublic } from './category-service.mapper';
import { toCategorySubcategoryPublic } from './category-subcategory.mapper';

export function toCategoryPublic(
  category: Category & {
    _count?: { companies: number };
    services?: CategoryService[];
    subcategories?: CategorySubcategory[];
  },
): CategoryPublic {
  return {
    id: category.id,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    slug: category.slug,
    iconUrl: category.iconUrl ?? null,
    companyCount: category._count?.companies,
    services: category.services?.map(toCategoryServicePublic),
    subcategories: category.subcategories?.map(toCategorySubcategoryPublic),
    createdAt: category.createdAt.toISOString(),
  };
}
