'use client';

import { CategoryCard } from '@/components/categories/category-card';
import { CarouselControls } from '@/components/home/carousel-controls';
import { scrollRevealProps } from '@/lib/scroll-reveal';
import { darkCard } from '@/lib/dark-surfaces';
import { SectionHeader } from '@/components/home/section-header';
import type { CategoryPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

interface CategoryCarouselProps {
  categories: CategoryPublic[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const t = useTranslations('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'next' ? 220 : -220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section
      {...scrollRevealProps('pop-up')}
      className="mt-[50px] py-12 dark:bg-dm-bg sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('categoriesTitle')}
          actionLabel={t('viewAllCategories')}
          actionHref="/categories"
          controls={
            <CarouselControls
              onPrev={() => scroll('prev')}
              onNext={() => scroll('next')}
              prevLabel={t('carouselPrev')}
              nextLabel={t('carouselNext')}
              className="hidden sm:flex"
            />
          }
        />

        {categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted dark:text-white/85">
            {t('noCategories')}
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                variant="compact"
                className={darkCard}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
