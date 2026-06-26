'use client';

import type { CompanyPublic } from '@rateq/types';
import { CarouselControls } from '@/components/home/carousel-controls';
import { FeaturedCompanyCard } from '@/components/home/featured-company-card';
import { SectionHeader } from '@/components/home/section-header';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

interface FeaturedCompaniesSectionProps {
  companies: CompanyPublic[];
}

export function FeaturedCompaniesSection({ companies }: FeaturedCompaniesSectionProps) {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'next' ? 400 : -400;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="bg-slate-50/60 py-12 dark:bg-[#323232] sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('featuredTitle')}
          actionLabel={t('viewAllCompanies')}
          actionHref="/search"
          controls={
            companies.length > 1 ? (
              <CarouselControls
                onPrev={() => scroll('prev')}
                onNext={() => scroll('next')}
                prevLabel={t('carouselPrev')}
                nextLabel={t('carouselNext')}
                className="hidden sm:flex"
              />
            ) : null
          }
        />

        {companies.length === 0 ? (
          <p className="py-12 text-center text-ink-muted dark:text-white/85">{tc('noResults')}</p>
        ) : (
          <div
            ref={scrollRef}
            className="scrollbar-hide -mx-4 grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
          >
            {companies.slice(0, 3).map((company) => (
              <FeaturedCompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
