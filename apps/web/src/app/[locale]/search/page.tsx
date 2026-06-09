import { CompanyCard } from '@/components/company/company-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchCategories } from '@/lib/categories-data';
import { fetchCompanies } from '@/lib/companies-data';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';

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
  if (params.country) query.set('country', params.country);
  if (params.city) query.set('city', params.city);
  if (params.minRating) query.set('minRating', params.minRating);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  query.set('sort', params.sort ?? 'rating');
  query.set('page', params.page ?? '1');
  query.set('limit', '12');

  const result = await fetchCompanies(query);
  const categories = await fetchCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <form className="mt-6 grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-3 lg:grid-cols-6">
        <Input name="query" placeholder={tc('searchPlaceholder')} defaultValue={params.query} />
        <Input name="country" placeholder={t('country')} defaultValue={params.country} />
        <Input name="city" placeholder={t('city')} defaultValue={params.city} />
        <Input
          name="minRating"
          type="number"
          min={0}
          max={5}
          step={0.5}
          placeholder={t('minRating')}
          defaultValue={params.minRating}
        />
        <select
          name="categoryId"
          defaultValue={params.categoryId ?? ''}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={params.sort ?? 'rating'}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
        >
          <option value="rating">{t('sortRating')}</option>
          <option value="reviews">{t('sortReviews')}</option>
          <option value="newest">{t('sortNewest')}</option>
          <option value="name">{t('sortName')}</option>
        </select>
        <div className="md:col-span-3 lg:col-span-6">
          <Button type="submit">{tc('search')}</Button>
        </div>
      </form>

      <div className="mt-8">
        {result.data.length === 0 ? (
          <p className="text-center text-slate-500 py-12">{tc('noResults')}</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">{result.meta.total} results</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
