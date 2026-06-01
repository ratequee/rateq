import { CategoryCompaniesSection } from '@/components/categories/category-companies-section';
import { CategoryDetailHero } from '@/components/categories/category-detail-hero';
import { CategoryFilters } from '@/components/categories/category-filters';
import { CategoriesCtaSection } from '@/components/categories/categories-cta-section';
import { RelatedCategoriesSection } from '@/components/categories/related-categories-section';
import { CATEGORY_IDS, getCategoryById, type CategoryId } from '@/lib/categories';
import { getMockCompaniesByCategory } from '@/lib/mock-companies';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { JSX } from 'react';
import { MobileAppsCta } from '@/components/home/mobile-apps-cta';

interface CategoryDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    query?: string;
    city?: string;
    minRating?: string;
    sort?: string;
    page?: string;
  }>;
}

export function generateStaticParams() {
  return CATEGORY_IDS.flatMap((slug) =>
    ['en', 'ar'].map((locale) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryById(slug);
  const t = await getTranslations('categories');

  if (!category) {
    return { title: 'Category' };
  }

  return {
    title: t(`items.${category.id}.name`),
    description: t(`items.${category.id}.description`),
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const filters = await searchParams;
  const category = getCategoryById(slug);

  if (!category) {
    notFound();
  }

  const result = getMockCompaniesByCategory(category.id as CategoryId, {
    query: filters.query?.trim() || undefined,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    sort: filters.sort ?? 'rating',
    page: Number(filters.page ?? 1),
    limit: 12,
  });
  const companies = result.data;
  const total = result.meta.total;

  return (
    <>
      <CategoryDetailHero category={category} />
      <CategoryFilters
        category={category}
        params={{
          query: filters.query,
          minRating: filters.minRating,
          sort: filters.sort,
        }}
      />
      <CategoryCompaniesSection companies={companies} total={total || category.count} />
      <RelatedCategoriesSection category={category} />
      <MobileAppsCta />
    </>
  );
}
