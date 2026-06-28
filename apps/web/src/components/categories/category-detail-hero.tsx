import { scrollRevealProps } from '@/lib/scroll-reveal';
import { CategoryBreadcrumb } from '@/components/categories/category-breadcrumb';
import { CategoryBilingualName } from '@/components/categories/category-bilingual-name';
import type { CategoryPublic } from '@rateq/types';
import { getTranslations, getLocale } from 'next-intl/server';
import type { JSX } from 'react';

interface CategoryDetailHeroProps {
  category: CategoryPublic;
}

export async function CategoryDetailHero({
  category,
}: CategoryDetailHeroProps): Promise<JSX.Element> {
  const tc = await getTranslations('categories');
  const locale = await getLocale();
  const label = locale === 'ar' ? category.nameAr : category.nameEn;

  return (
    <section
      {...scrollRevealProps('fade-in')}
      className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 py-12 text-white sm:py-16 lg:py-20"
      style={{
        backgroundImage: 'url(/images/herobg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(237,197,111,0.15),transparent_50%)]" />
      <div className="relative mx-auto flex max-w-page flex-row flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div>
            <CategoryBilingualName
              nameEn={category.nameEn}
              nameAr={category.nameAr}
              as="div"
              primaryClassName="text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
              secondaryClassName="text-2xl font-semibold text-white/90 sm:text-3xl"
            />
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {tc('categoryDescription', { name: label })}
            </p>
          </div>
        </div>
        <CategoryBreadcrumb category={category} variant="dark" />
      </div>
    </section>
  );
}
