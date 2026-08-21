import { LegalDocument } from '@/components/legal/legal-document';
import { fetchSiteSettings } from '@/lib/platform-data';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legalPrivacy');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function PrivacyPolicyPage(): Promise<JSX.Element> {
  const locale = await getLocale();
  const settings = await fetchSiteSettings();
  const cmsPoints =
    locale === 'ar'
      ? settings.privacyPolicyAr?.length
        ? settings.privacyPolicyAr
        : settings.privacyPolicyEn
      : settings.privacyPolicyEn?.length
        ? settings.privacyPolicyEn
        : settings.privacyPolicyAr;

  return <LegalDocument namespace="legalPrivacy" cmsPoints={cmsPoints} />;
}
