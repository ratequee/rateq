'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategoryLabel } from '@/lib/category-label';
import type { CategoryPublic } from '@rateq/types';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

interface SearchFiltersFormProps {
  categories: CategoryPublic[];
  initialQuery?: string;
  initialCategoryId?: string;
  initialSort?: string;
}

export function SearchFiltersForm({
  categories,
  initialQuery,
  initialCategoryId,
  initialSort,
}: SearchFiltersFormProps) {
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? '');

  return (
    <form className="mt-6 grid gap-4 rounded-2xl border border-subtle surface-card p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <div className="lg:col-span-2">
        <label htmlFor="search-query" className="mb-1.5 block text-xs font-medium text-secondary">
          {tc('search')}
        </label>
        <Input
          id="search-query"
          name="query"
          placeholder={tc('searchPlaceholder')}
          defaultValue={initialQuery}
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
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
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
        <label htmlFor="search-sort" className="mb-1.5 block text-xs font-medium text-secondary">
          {t('sortBy')}
        </label>
        <select
          id="search-sort"
          name="sort"
          defaultValue={initialSort ?? 'rating'}
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
  );
}
