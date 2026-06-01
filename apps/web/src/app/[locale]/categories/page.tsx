import { CategoriesGrid } from '@/components/categories/categories-grid';
import { CategoriesHeroSection } from '@/components/categories/categories-hero-section';
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';
import { MobileAppsCta } from '@/components/home/mobile-apps-cta';

interface CategoriesPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('categories');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

function parseCategory(value?: string): CategoryId | undefined {
  if (!value) return undefined;
  return CATEGORY_IDS.includes(value as CategoryId) ? (value as CategoryId) : undefined;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const activeCategory = parseCategory(params.category);

  return (
    <>
      <CategoriesHeroSection />
      <CategoriesGrid initialQuery={params.q ?? ''} activeCategory={activeCategory} />
      <MobileAppsCta />
    </>
  );
}
