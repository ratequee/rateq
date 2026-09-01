export type AppFontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

/** Matches web: Nunito (en) + Noto Sans Arabic (ar) from next/font/google */
export const FONT_FAMILIES = {
  en: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
  },
  ar: {
    regular: 'NotoSansArabic_400Regular',
    medium: 'NotoSansArabic_500Medium',
    semibold: 'NotoSansArabic_600SemiBold',
    bold: 'NotoSansArabic_700Bold',
  },
} as const;

export function isArabicLocale(language?: string | null): boolean {
  return (language ?? 'en').startsWith('ar');
}

export function getFontFamilyForLocale(
  language: string | null | undefined,
  weight: AppFontWeight = 'regular',
): string {
  const families = isArabicLocale(language) ? FONT_FAMILIES.ar : FONT_FAMILIES.en;
  return families[weight];
}

/** Pick Nunito vs Noto based on the characters being rendered (not just app locale). */
export function getFontFamilyForText(
  text: string,
  weight: AppFontWeight = 'regular',
  fallbackLocale?: string | null,
): string {
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (hasArabic) return getFontFamilyForLocale('ar', weight);
  if (fallbackLocale) return getFontFamilyForLocale(fallbackLocale, weight);
  return getFontFamilyForLocale('en', weight);
}

export function fontWeightToAppWeight(
  fontWeight: string | number | undefined,
): AppFontWeight | null {
  if (fontWeight == null) return null;

  const value = typeof fontWeight === 'number' ? fontWeight : fontWeight;
  if (value === 'bold' || value === '700' || value === 700) return 'bold';
  if (value === '600' || value === 600 || value === 'semibold') return 'semibold';
  if (value === '500' || value === 500 || value === 'medium') return 'medium';
  if (value === '400' || value === 400 || value === 'normal' || value === 'regular') {
    return 'regular';
  }

  return null;
}

export function classNameToAppWeight(className?: string): AppFontWeight | null {
  if (!className) return null;
  if (/\bfont-bold\b/.test(className)) return 'bold';
  if (/\bfont-semibold\b/.test(className)) return 'semibold';
  if (/\bfont-medium\b/.test(className)) return 'medium';
  if (/\bfont-normal\b/.test(className) || /\bfont-regular\b/.test(className)) {
    return 'regular';
  }
  return null;
}
