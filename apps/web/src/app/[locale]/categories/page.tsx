import { CategoriesGrid } from '@/components/categories/categories-grid';
import { CategoriesHeroSection } from '@/components/categories/categories-hero-section';
import { fetchCategories } from '@/lib/categories-data';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';
// import { MobileAppsCta } from '@/components/home/mobile-apps-cta';

export const dynamic = 'force-dynamic';

interface CategoriesPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('categories');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const categories = await fetchCategories();

  return (
    <>
      <CategoriesHeroSection />
      <CategoriesGrid
        categories={categories}
        initialQuery={params.q ?? ''}
        activeCategorySlug={params.category}
      />
      {/* <MobileAppsCta /> */}
    </>
  );
}
