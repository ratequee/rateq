import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CategoryPublic } from '@rateq/types';
import { getLocale, getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CategoryFiltersProps {
  category: CategoryPublic;
  params: {
    query?: string;
    city?: string;
    minRating?: string;
    sort?: string;
  };
}

export async function CategoryFilters({
  category,
  params,
}: CategoryFiltersProps): Promise<JSX.Element> {
  const locale = await getLocale();
  const t = await getTranslations('categoryPage');
  const ts = await getTranslations('search');

  return (
    <section className="border-b border-slate-100 bg-white py-6">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <form
          action={`/${locale}/categories/${category.slug}`}
          className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <div className="lg:col-span-2">
            <label htmlFor="query" className="mb-1.5 block text-xs font-medium text-ink-muted">
              {t('filterSearch')}
            </label>
            <Input
              id="query"
              name="query"
              defaultValue={params.query}
              placeholder={t('searchPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="minRating" className="mb-1.5 block text-xs font-medium text-ink-muted">
              {ts('minRating')}
            </label>
            <Input
              id="minRating"
              name="minRating"
              type="number"
              min={0}
              max={5}
              step={0.5}
              defaultValue={params.minRating}
              placeholder="4.0"
            />
          </div>
          <div>
            <label htmlFor="sort" className="mb-1.5 block text-xs font-medium text-ink-muted">
              {ts('sortBy')}
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={params.sort ?? 'rating'}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink"
            >
              <option value="rating">{ts('sortRating')}</option>
              <option value="reviews">{ts('sortReviews')}</option>
              <option value="newest">{ts('sortNewest')}</option>
              <option value="name">{ts('sortName')}</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit">{t('applyFilters')}</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
