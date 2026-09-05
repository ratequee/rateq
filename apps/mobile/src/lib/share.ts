import Constants from 'expo-constants';
import { getCurrentLocale } from '@/i18n';
import { Share } from 'react-native';

const DEFAULT_WEB_ORIGIN = 'https://www.rateq.qa';

export function getWebAppOrigin(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WEB_URL) ||
    (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl;

  const raw = (fromEnv || DEFAULT_WEB_ORIGIN).trim().replace(/\/$/, '');
  return raw || DEFAULT_WEB_ORIGIN;
}

/** Public web URL for a company project detail page. */
export function getProjectShareUrl(companySlug: string, projectSlug: string): string {
  const locale = getCurrentLocale();
  return `${getWebAppOrigin()}/${locale}/companies/${companySlug}/projects/${projectSlug}`;
}

export async function shareProjectLink(input: {
  companySlug: string;
  projectSlug: string;
  title: string;
  message?: string;
}): Promise<'shared' | 'dismissed'> {
  const url = getProjectShareUrl(input.companySlug, input.projectSlug);
  const result = await Share.share({
    title: input.title,
    message: input.message ? `${input.message}\n${url}` : url,
    url,
  });

  if (result.action === Share.sharedAction) {
    return 'shared';
  }

  return 'dismissed';
}
