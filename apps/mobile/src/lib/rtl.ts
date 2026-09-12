import type { AppLocale } from '@/lib/preferences';
import { I18nManager, type TextStyle, type ViewStyle } from 'react-native';

export function applyRtl(locale: AppLocale): void {
  const isRtl = locale === 'ar';
  // Do not call forceRTL here — it requires a full native restart and can
  // look like a crash loop on first Arabic launch. Layout uses RtlRoot direction.
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  void isRtl;
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

/** Isolate text from RtlRoot so physical textAlign left/right are not inverted. */
export function getTextBlockContainerStyle(): ViewStyle {
  return {
    width: '100%',
    direction: 'ltr',
  };
}
