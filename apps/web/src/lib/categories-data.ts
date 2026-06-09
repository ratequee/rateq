import type { CategoriesListResponse, CategoryPublic } from '@rateq/types';
import { categoriesApi } from '@/lib/categories-api';

export async function fetchCategories(): Promise<CategoriesListResponse> {
  return categoriesApi.list();
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryPublic | null> {
  try {
    return await categoriesApi.getBySlug(slug);
  } catch {
    return null;
  }
}

export function getFeaturedCategories(
  categories: CategoriesListResponse,
  limit = 6,
): CategoryPublic[] {
  return [...categories]
    .sort((a, b) => (b.companyCount ?? 0) - (a.companyCount ?? 0))
    .slice(0, limit);
}

export function getRelatedCategories(
  categories: CategoriesListResponse,
  currentSlug: string,
  limit = 4,
): CategoryPublic[] {
  return categories.filter((category) => category.slug !== currentSlug).slice(0, limit);
}
