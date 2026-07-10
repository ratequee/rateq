import { CategoryCompaniesSection } from '@/components/categories/category-companies-section';
import { CategoryDetailHero } from '@/components/categories/category-detail-hero';
import { CategoryFilters } from '@/components/categories/category-filters';
import { CategorySubcategoriesSection } from '@/components/categories/category-subcategories-section';
import { RelatedCategoriesSection } from '@/components/categories/related-categories-section';
import { fetchCompanies } from '@/lib/companies-data';
import { fetchCategoryBySlug } from '@/lib/categories-data';
import { getCategoryLabel } from '@/lib/category-label';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

interface CategoryDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    query?: string;
    subcategoryId?: string;
    view?: string;
    city?: string;
    minRating?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category' };
  }

  const label = getCategoryLabel(category, locale);

  return {
    title: label,
    description: `${label} companies on RateQ`,
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const filters = await searchParams;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const subcategories = category.subcategories ?? [];
  const showSubcategories =
    subcategories.length > 0 &&
    !filters.subcategoryId &&
    filters.view !== 'all' &&
    !filters.query?.trim() &&
    !filters.minRating &&
    !filters.sort &&
    !filters.page;

  if (showSubcategories) {
    return (
      <>
        <CategoryDetailHero category={category} />
        <CategorySubcategoriesSection category={category} />
        <RelatedCategoriesSection category={category} />
      </>
    );
  }

  const query = new URLSearchParams({
    sort: filters.sort ?? 'rating',
    page: filters.page ?? '1',
    limit: '12',
    categoryId: category.id,
  });
  if (filters.query?.trim()) query.set('query', filters.query.trim());
  if (filters.subcategoryId) query.set('subcategoryId', filters.subcategoryId);
  if (filters.minRating) query.set('minRating', filters.minRating);

  const result = await fetchCompanies(query);
  const companies = result.data;
  const total = result.meta.total;

  return (
    <>
      <CategoryDetailHero category={category} />
      <CategoryFilters
        category={category}
        params={{
          query: filters.query,
          subcategoryId: filters.subcategoryId,
          minRating: filters.minRating,
          sort: filters.sort,
          view: filters.view,
        }}
      />
      <CategoryCompaniesSection companies={companies} total={total} />
      <RelatedCategoriesSection category={category} />
    </>
  );
}
