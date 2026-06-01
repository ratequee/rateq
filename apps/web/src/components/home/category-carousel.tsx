'use client';

import { CategoryCard } from '@/components/categories/category-card';
import { CarouselControls } from '@/components/home/carousel-controls';
import { SectionHeader } from '@/components/home/section-header';
import { HOME_CATEGORIES } from '@/lib/categories';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

export function CategoryCarousel() {
  const t = useTranslations('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'next' ? 220 : -220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="mt-[50px] py-12 sm:py-16 lg:py-20">
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

        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        >
          {HOME_CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}
