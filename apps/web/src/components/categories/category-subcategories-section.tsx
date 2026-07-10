'use client';

import { scrollRevealProps, scrollStaggerDelay } from '@/lib/scroll-reveal';
import { SubcategoryCard } from '@/components/categories/subcategory-card';
import { Link } from '@/i18n/routing';
import type { CategoryPublic } from '@rateq/types';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CategorySubcategoriesSectionProps {
  category: CategoryPublic;
}

export function CategorySubcategoriesSection({ category }: CategorySubcategoriesSectionProps) {
  const t = useTranslations('categoryPage');
  const subcategories = category.subcategories ?? [];
  const companyCount = category.companyCount ?? 0;

  return (
    <section {...scrollRevealProps('fade-in')} className="py-12 dark:bg-dm-bg sm:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-3xl">
            {t('subcategoriesTitle')}
          </h2>
          <p className="mt-2 text-sm text-secondary dark:text-white/80">
            {t('subcategoriesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          <div {...scrollRevealProps('pop-up', scrollStaggerDelay(0))}>
            <Link
              href={`/categories/${category.slug}?view=all`}
              className="group relative flex min-h-[160px] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-5 text-center transition-transform duration-300 ease-out hover:z-10 hover:scale-105 hover:border-brand-500 hover:bg-brand-50 focus-visible:scale-105 dark:border-brand-700 dark:bg-brand-950/30 sm:min-h-[180px]"
            >
              <Building2 className="h-8 w-8 text-brand-500" aria-hidden />
              <p className="mt-3 text-base font-bold text-brand-600 dark:text-brand-300">
                {t('viewAllCompanies')}
              </p>
              <p className="mt-1 text-sm text-secondary dark:text-white/75">
                {t('companiesSubtitle', { count: companyCount })}
              </p>
            </Link>
          </div>

          {subcategories.map((subcategory, index) => (
            <div
              key={subcategory.id}
              {...scrollRevealProps('pop-up', scrollStaggerDelay((index + 1) % 8))}
            >
              <SubcategoryCard categorySlug={category.slug} subcategory={subcategory} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
