import en from './locales/en.json';
import ar from './locales/ar.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const initialLocale = deviceLocale === 'ar' ? 'ar' : 'en';

export function applyRtl(locale: string): void {
  const isRtl = locale === 'ar';
  if (I18nManager.isRTL !== isRtl) {
    I18nManager.allowRTL(isRtl);
    I18nManager.forceRTL(isRtl);
  }
}

applyRtl(initialLocale);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

export async function changeLanguage(locale: 'en' | 'ar'): Promise<void> {
  applyRtl(locale);
  await i18n.changeLanguage(locale);
}

export function getCurrentLocale(): 'en' | 'ar' {
  return i18n.language === 'ar' ? 'ar' : 'en';
}
