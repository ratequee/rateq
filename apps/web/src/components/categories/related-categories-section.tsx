import { CategoryCard } from '@/components/categories/category-card';
import { getRelatedCategories, type CategoryDefinition } from '@/lib/categories';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface RelatedCategoriesSectionProps {
  category: CategoryDefinition;
}

export async function RelatedCategoriesSection({
  category,
}: RelatedCategoriesSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('categoryPage');
  const related = getRelatedCategories(category.id);

  return (
    <section className="border-t border-slate-100 bg-slate-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('relatedTitle')}</h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {t('viewAllCategories')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-5">
          {related.map((item) => (
            <CategoryCard key={item.id} category={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
