import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALE_KEY = 'rateq_locale';
const THEME_KEY = 'rateq_theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type AppLocale = 'en' | 'ar';

export async function getStoredLocale(): Promise<AppLocale | null> {
  const value = await AsyncStorage.getItem(LOCALE_KEY);
  return value === 'ar' || value === 'en' ? value : null;
}

export async function setStoredLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

export async function getStoredTheme(): Promise<ThemePreference | null> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

export async function setStoredTheme(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}
