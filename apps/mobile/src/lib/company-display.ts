import type { CompanyPublic } from '@rateq/types';

function isArabicLocale(locale: string): boolean {
  return locale.startsWith('ar');
}

export function getLocalizedCompanyName(company: CompanyPublic, locale: string): string {
  if (isArabicLocale(locale)) {
    return company.nameAr?.trim() || company.name;
  }
  return company.name;
}

export function getSecondaryCompanyName(company: CompanyPublic, locale: string): string | null {
  const english = company.name.trim();
  const arabic = company.nameAr?.trim();

  if (!arabic || arabic === english) return null;
  return isArabicLocale(locale) ? english : arabic;
}

export function getLocalizedCompanyDescription(
  company: CompanyPublic,
  locale: string,
): string | null {
  if (isArabicLocale(locale)) {
    return company.descriptionAr?.trim() || null;
  }
  return company.descriptionEn?.trim() || company.description?.trim() || null;
}

export function buildTopMentions(reviews: { title: string }[]): string[] {
  return [
    ...new Set(
      reviews.map((review) => {
        const words = review.title.trim().split(/\s+/);
        if (words.length <= 3) return review.title.trim();
        return words.slice(0, 3).join(' ');
      }),
    ),
  ]
    .filter(Boolean)
    .slice(0, 6);
}
