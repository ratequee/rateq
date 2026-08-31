import en from './locales/en.json';
import ar from './locales/ar.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { getStoredLocale, setStoredLocale, type AppLocale } from '@/lib/preferences';
import { applyRtl, isRtlLocale as checkRtl } from '@/lib/rtl';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

function detectDeviceLocale(): AppLocale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return deviceLocale === 'ar' ? 'ar' : 'en';
}

let initPromise: Promise<AppLocale> | null = null;

function mergeResources() {
  for (const [lng, bundle] of Object.entries(resources)) {
    i18n.addResourceBundle(lng, 'translation', bundle.translation, true, true);
  }
}

export async function initI18n(): Promise<AppLocale> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const stored = await getStoredLocale();
    const locale = stored ?? detectDeviceLocale();
    applyRtl(locale);

    if (!i18n.isInitialized) {
      await i18n.use(initReactI18next).init({
        resources,
        lng: locale,
        fallbackLng: 'en',
        supportedLngs: ['en', 'ar'],
        nonExplicitSupportedLngs: true,
        interpolation: { escapeValue: false },
        returnNull: false,
      });
    } else {
      mergeResources();
      await i18n.changeLanguage(locale);
    }

    return locale;
  })();

  return initPromise;
}

export default i18n;

export async function changeLanguage(locale: AppLocale): Promise<void> {
  applyRtl(locale);
  await i18n.changeLanguage(locale);
  await setStoredLocale(locale);
}

export function getCurrentLocale(): AppLocale {
  const language = i18n.language ?? 'en';
  return language.startsWith('ar') ? 'ar' : 'en';
}

export function isRtlLocale(): boolean {
  return checkRtl(i18n.language);
}

export function getFontFamily(weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular') {
  const isArabic = isRtlLocale();
  const map = {
    regular: isArabic ? 'NotoSansArabic_400Regular' : 'Nunito_400Regular',
    medium: isArabic ? 'NotoSansArabic_500Medium' : 'Nunito_500Medium',
    semibold: isArabic ? 'NotoSansArabic_600SemiBold' : 'Nunito_600SemiBold',
    bold: isArabic ? 'NotoSansArabic_700Bold' : 'Nunito_700Bold',
  };
  return map[weight];
}

export { applyRtl } from '@/lib/rtl';
