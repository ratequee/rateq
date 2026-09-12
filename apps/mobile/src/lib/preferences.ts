import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALE_KEY = 'rateq_locale';
const THEME_KEY = 'rateq_theme';
const GUEST_KEY = 'rateq_guest_mode';

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

export async function getStoredGuestMode(): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_KEY);
  return value === '1';
}

export async function setStoredGuestMode(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    return;
  }
  await AsyncStorage.removeItem(GUEST_KEY);
}
