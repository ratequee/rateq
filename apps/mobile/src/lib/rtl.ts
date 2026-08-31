import type { AppLocale } from '@/lib/preferences';
import { I18nManager, type TextStyle, type ViewStyle } from 'react-native';

export function applyRtl(locale: AppLocale): void {
  const isRtl = locale === 'ar';
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);

  if (I18nManager.isRTL !== isRtl) {
    I18nManager.forceRTL(isRtl);
  }
}

export function isRtlLocale(locale?: string): boolean {
  const lng = locale ?? '';
  return lng === 'ar' || lng.startsWith('ar-');
}

export function getLayoutDirectionStyle(locale?: string): ViewStyle {
  return {
    flex: 1,
    direction: isRtlLocale(locale) ? 'rtl' : 'ltr',
  };
}

export function getTextDirectionStyle(locale?: string): TextStyle {
  return isRtlLocale(locale)
    ? { textAlign: 'right', writingDirection: 'rtl' }
    : { textAlign: 'left', writingDirection: 'ltr' };
}
