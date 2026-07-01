import { CompanyCard } from '@/components/company/company-card';
import { SearchFiltersForm } from '@/components/search/search-filters-form';
import { fetchCategories } from '@/lib/categories-data';
import { fetchCompanies } from '@/lib/companies-data';
import { scrollRevealProps, scrollStaggerDelay } from '@/lib/scroll-reveal';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('search');
  return { title: t('title') };
}

export default async function SearchPage({ searchParams }: SearchPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const t = await getTranslations('search');
  const tc = await getTranslations('common');

  const query = new URLSearchParams();
  if (params.query) query.set('query', params.query);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.subcategoryId) query.set('subcategoryId', params.subcategoryId);
  query.set('sort', params.sort ?? 'rating');
  query.set('page', params.page ?? '1');
  query.set('limit', '12');

  const result = await fetchCompanies(query);
  const categories = await fetchCategories();

  return (
    <div className="surface-page min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div {...scrollRevealProps('fade-in')}>
          <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-sm text-secondary sm:text-base">{tc('searchPlaceholder')}</p>
        </div>

        <div {...scrollRevealProps('fade-up', 80)}>
          <SearchFiltersForm
            categories={categories}
            initialQuery={params.query}
            initialCategoryId={params.categoryId}
            initialSubcategoryId={params.subcategoryId}
            initialSort={params.sort}
          />
        </div>

        <div {...scrollRevealProps('fade-up', 120)} className="mt-8">
          {result.data.length === 0 ? (
            <p className="py-12 text-center text-secondary">{tc('noResults')}</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-secondary">
                {t('resultsCount', { count: result.meta.total })}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map((company, index) => (
                  <div
                    key={company.id}
                    {...scrollRevealProps('fade-up', scrollStaggerDelay(index))}
                  >
                    <CompanyCard company={company} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
