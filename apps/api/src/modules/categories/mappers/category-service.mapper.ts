import type { CategoryService } from '@prisma/client';
import type { CategoryServicePublic } from '@rateq/types';

export function toCategoryServicePublic(service: CategoryService): CategoryServicePublic {
  return {
    id: service.id,
    categoryId: service.categoryId,
    name: service.name,
    slug: service.slug,
    sortOrder: service.sortOrder,
  };
}
