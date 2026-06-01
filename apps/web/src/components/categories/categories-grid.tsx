'use client';

import { CategoryCard } from '@/components/categories/category-card';
import { CATEGORIES, type CategoryId } from '@/lib/categories';
import { useTranslations } from 'next-intl';

interface CategoriesGridProps {
  initialQuery?: string;
  activeCategory?: CategoryId;
}

function matchesQuery(name: string, description: string, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    name.toLowerCase().includes(normalized) || description.toLowerCase().includes(normalized)
  );
}

export function CategoriesGrid({ initialQuery = '', activeCategory }: CategoriesGridProps) {
  const t = useTranslations('categories');

  const filtered = CATEGORIES.filter((category) => {
    if (activeCategory && category.id !== activeCategory) return false;
    const name = t(`items.${category.id}.name`);
    const description = t(`items.${category.id}.description`);
    return matchesQuery(name, description, initialQuery);
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {filtered.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
