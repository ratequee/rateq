import type { CategorySubcategory } from '@prisma/client';
import type { CategorySubcategoryPublic } from '@rateq/types';

export function toCategorySubcategoryPublic(
  subcategory: CategorySubcategory,
): CategorySubcategoryPublic {
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    nameEn: subcategory.nameEn,
    nameAr: subcategory.nameAr,
    slug: subcategory.slug,
    sortOrder: subcategory.sortOrder,
  };
}
