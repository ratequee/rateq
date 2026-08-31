export function getCategoryLabel(
  category: { nameEn: string; nameAr: string },
  locale: string,
): string {
  return locale === 'ar' ? category.nameAr : category.nameEn;
}

export function getLocalizedCategoryName(
  source: { categoryName?: string | null; categoryNameAr?: string | null },
  locale: string,
): string | null {
  const en = source.categoryName?.trim();
  const ar = source.categoryNameAr?.trim();
  if (locale === 'ar') return ar || en || null;
  return en || ar || null;
}
