import { AboutHeroSection } from '@/components/about/about-hero-section';
import { AboutStorySection } from '@/components/about/about-story-section';
import { MobileAppsCta } from '@/components/home/mobile-apps-cta';
import { PartnersSection } from '@/components/home/partners-section';
import { fetchCompanies } from '@/lib/companies-data';
import { fetchPlatformStats } from '@/lib/platform-data';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';
import { WhyChooseSection } from '@/components/home/why-choose-section';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function AboutPage(): Promise<JSX.Element> {
  const [stats, companiesResult] = await Promise.all([
    fetchPlatformStats(),
    fetchCompanies(new URLSearchParams({ sort: 'rating', limit: '5' })),
  ]);

  return (
    <>
      <AboutHeroSection />
      <WhyChooseSection />
      <AboutStorySection stats={stats} />
      <PartnersSection companies={companiesResult.data} />
      <MobileAppsCta />
    </>
  );
}
