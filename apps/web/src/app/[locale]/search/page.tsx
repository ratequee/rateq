import { CompanyCard } from '@/components/company/company-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategoryLabel } from '@/lib/category-label';
import { fetchCategories } from '@/lib/categories-data';
import { fetchCompanies } from '@/lib/companies-data';
import { getTranslations, getLocale } from 'next-intl/server';
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
  const locale = await getLocale();

  const query = new URLSearchParams();
  if (params.query) query.set('query', params.query);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  query.set('sort', params.sort ?? 'rating');
  query.set('page', params.page ?? '1');
  query.set('limit', '12');

  const result = await fetchCompanies(query);
  const categories = await fetchCategories();

  return (
    <div className="surface-page min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-sm text-secondary sm:text-base">{tc('searchPlaceholder')}</p>

        <form className="mt-6 grid gap-4 rounded-2xl border border-subtle surface-card p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="lg:col-span-2">
            <label
              htmlFor="search-query"
              className="mb-1.5 block text-xs font-medium text-secondary"
            >
              {tc('search')}
            </label>
            <Input
              id="search-query"
              name="query"
              placeholder={tc('searchPlaceholder')}
              defaultValue={params.query}
            />
          </div>
          <div>
            <label
              htmlFor="search-category"
              className="mb-1.5 block text-xs font-medium text-secondary"
            >
              {t('category')}
            </label>
            <select
              id="search-category"
              name="categoryId"
              defaultValue={params.categoryId ?? ''}
              className="select-field"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryLabel(category, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="search-sort"
              className="mb-1.5 block text-xs font-medium text-secondary"
            >
              {t('sortBy')}
            </label>
            <select
              id="search-sort"
              name="sort"
              defaultValue={params.sort ?? 'rating'}
              className="select-field"
            >
              <option value="rating">{t('sortRating')}</option>
              <option value="reviews">{t('sortReviews')}</option>
              <option value="newest">{t('sortNewest')}</option>
              <option value="name">{t('sortName')}</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit">{tc('search')}</Button>
          </div>
        </form>

        <div className="mt-8">
          {result.data.length === 0 ? (
            <p className="py-12 text-center text-secondary">{tc('noResults')}</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-secondary">
                {t('resultsCount', { count: result.meta.total })}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
