import { scrollRevealProps } from '@/lib/scroll-reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CategoryPublic } from '@rateq/types';
import { getLocale, getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CategoryFiltersProps {
  category: CategoryPublic;
  params: {
    query?: string;
    subcategoryId?: string;
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
  const subcategories = category.subcategories ?? [];

  return (
    <section
      {...scrollRevealProps('fade-up')}
      className="border-b border-slate-100 bg-white py-6 dark:border-dm-border dark:bg-dm-bg"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <form
          action={`/${locale}/categories/${category.slug}`}
          className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-dm-border dark:bg-dm-elevated/60 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <div className="lg:col-span-2">
            <label
              htmlFor="query"
              className="mb-1.5 block text-xs font-medium text-ink-muted dark:text-white/85"
            >
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
            <label
              htmlFor="subcategoryId"
              className="mb-1.5 block text-xs font-medium text-ink-muted dark:text-white/85"
            >
              {ts('subcategory')}
            </label>
            <select
              id="subcategoryId"
              name="subcategoryId"
              defaultValue={params.subcategoryId ?? ''}
              className="select-field"
              disabled={subcategories.length === 0}
            >
              <option value="">{ts('allSubcategories')}</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {locale === 'ar' ? subcategory.nameAr : subcategory.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="minRating"
              className="mb-1.5 block text-xs font-medium text-ink-muted dark:text-white/85"
            >
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
            <label
              htmlFor="sort"
              className="mb-1.5 block text-xs font-medium text-ink-muted dark:text-white/85"
            >
              {ts('sortBy')}
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={params.sort ?? 'rating'}
              className="select-field"
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
