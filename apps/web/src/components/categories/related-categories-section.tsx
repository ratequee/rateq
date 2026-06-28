import { scrollRevealProps, scrollStaggerDelay } from '@/lib/scroll-reveal';
import { CategoryCard } from '@/components/categories/category-card';
import { fetchCategories, getRelatedCategories } from '@/lib/categories-data';
import { Link } from '@/i18n/routing';
import type { CategoryPublic } from '@rateq/types';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface RelatedCategoriesSectionProps {
  category: CategoryPublic;
}

export async function RelatedCategoriesSection({
  category,
}: RelatedCategoriesSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('categoryPage');
  const categories = await fetchCategories();
  const related = getRelatedCategories(categories, category.slug);

  if (related.length === 0) return <></>;

  return (
    <section
      {...scrollRevealProps('fade-up')}
      className="border-t border-slate-100 bg-slate-50/60 py-12 dark:border-dm-border dark:bg-dm-surface sm:py-16"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-3xl">
            {t('relatedTitle')}
          </h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-white/85"
          >
            {t('viewAllCategories')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-5">
          {related.map((item, index) => (
            <div key={item.id} {...scrollRevealProps('fade-up', scrollStaggerDelay(index))}>
              <CategoryCard category={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
