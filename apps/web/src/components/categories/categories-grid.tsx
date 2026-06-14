'use client';

import { CategoryCard } from '@/components/categories/category-card';
import type { CategoryPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';

interface CategoriesGridProps {
  categories: CategoryPublic[];
  initialQuery?: string;
  activeCategorySlug?: string;
}

function matchesQuery(name: string, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return name.toLowerCase().includes(normalized);
}

export function CategoriesGrid({
  categories,
  initialQuery = '',
  activeCategorySlug,
}: CategoriesGridProps) {
  const t = useTranslations('categories');

  const filtered = categories.filter((category) => {
    if (activeCategorySlug && category.slug !== activeCategorySlug) return false;
    if (matchesQuery(category.name, initialQuery)) return true;
    return (category.services ?? []).some((service) => matchesQuery(service.name, initialQuery));
  });

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('allCategoriesTitle')}</h2>
          </div>
          <p className="text-sm font-medium text-ink-muted">
            {t('resultsCount', { count: filtered.length })}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-ink-muted">{t('noResults')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {filtered.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
