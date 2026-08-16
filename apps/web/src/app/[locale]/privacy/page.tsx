import { LegalDocument } from '@/components/legal/legal-document';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legalPrivacy');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function PrivacyPolicyPage(): Promise<JSX.Element> {
  return <LegalDocument namespace="legalPrivacy" />;
}
