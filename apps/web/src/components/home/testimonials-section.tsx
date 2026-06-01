'use client';

import { CarouselControls } from '@/components/home/carousel-controls';
import { SectionHeader } from '@/components/home/section-header';
import { StarRating } from '@/components/ui/star-rating';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef } from 'react';

const TESTIMONIALS = [
  { id: '1', authorKey: 'testimonial1Author', roleKey: 'testimonial1Role', quoteKey: 'testimonial1Quote' },
  { id: '2', authorKey: 'testimonial2Author', roleKey: 'testimonial2Role', quoteKey: 'testimonial2Quote' },
  { id: '3', authorKey: 'testimonial3Author', roleKey: 'testimonial3Role', quoteKey: 'testimonial3Quote' },
] as const;

export function TestimonialsSection() {
  const t = useTranslations('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'next' ? 360 : -360;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('testimonialsTitle')}
          actionLabel={t('viewAllCompanies')}
          actionHref="/search"
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
          className="scrollbar-hide -mx-4 grid auto-cols-[minmax(300px,1fr)] grid-flow-col gap-5 overflow-x-auto px-4 sm:mx-0 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
        >
          {TESTIMONIALS.map(({ id, authorKey, roleKey, quoteKey }) => (
            <article
              key={id}
              className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Image src={"/images/author.svg"} alt={t(authorKey)} width={50} height={50} />
                <div className="flex flex-col">
                  <p className="font-semibold text-ink">{t(authorKey)}</p>
                  <p className="text-sm text-ink-muted">{t(roleKey)}</p>
                </div>
              </div>
              <StarRating value={5} size="md" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-muted">
                &ldquo;{t(quoteKey)}&rdquo;
              </blockquote>
              <div className="mt-6 border-t-2 border-slate-100 pt-4">
                <div className="flex items-center gap-3">
                  <Image src={"/images/company_avatar.svg"} alt={t('testimonialCompany')} width={50} height={50} />
                  <div>
                    <p className="text-sm font-medium text-ink">{t('testimonialCompany')}</p>
                    <p className="text-xs text-ink-muted">{t('testimonialCompanyRole')}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
