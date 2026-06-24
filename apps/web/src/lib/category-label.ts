export function getCategoryLabel(
  category: { nameEn: string; nameAr: string },
  locale: string,
): string {
  return locale === 'ar' ? category.nameAr : category.nameEn;
}

export function categoryMatchesQuery(
  category: { nameEn: string; nameAr: string },
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    category.nameEn.toLowerCase().includes(normalized) ||
    category.nameAr.toLowerCase().includes(normalized)
  );
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
