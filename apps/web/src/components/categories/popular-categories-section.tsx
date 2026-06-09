import { CategoryCard } from '@/components/categories/category-card';
import { getFeaturedCategories } from '@/lib/categories-data';
import { fetchCategories } from '@/lib/categories-data';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function PopularCategoriesSection(): Promise<JSX.Element> {
  const t = await getTranslations('categories');
  const categories = await fetchCategories();
  const featured = getFeaturedCategories(categories);

  return (
    <section className="bg-slate-50/60 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('popularTitle')}</h2>
          <p className="mt-3 text-base text-ink-muted">{t('popularSubtitle')}</p>
        </div>

        {featured.length === 0 ? (
          <p className="mt-10 text-center text-ink-muted">{t('noResults')}</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((category) => (
              <CategoryCard key={category.id} category={category} variant="featured" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
