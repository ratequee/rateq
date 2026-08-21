import { LegalDocument } from '@/components/legal/legal-document';
import { fetchSiteSettings } from '@/lib/platform-data';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legalTerms');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function TermsPage(): Promise<JSX.Element> {
  const locale = await getLocale();
  const settings = await fetchSiteSettings();
  const cmsContent =
    locale === 'ar'
      ? settings.termsOfServiceAr?.trim() || settings.termsOfServiceEn?.trim() || null
      : settings.termsOfServiceEn?.trim() || settings.termsOfServiceAr?.trim() || null;

  return <LegalDocument namespace="legalTerms" cmsContent={cmsContent} />;
}
