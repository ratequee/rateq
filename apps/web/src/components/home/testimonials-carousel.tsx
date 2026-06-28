'use client';

import { darkBorder, darkCard } from '@/lib/dark-surfaces';
import { CarouselControls } from '@/components/home/carousel-controls';
import { SectionHeader } from '@/components/home/section-header';
import { AvatarImage } from '@/components/ui/avatar-image';
import { StarRating } from '@/components/ui/star-rating';
import { Link } from '@/i18n/routing';
import { getLocalizedCategoryName } from '@/lib/category-label';
import type { ReviewPublic } from '@rateq/types';
import { useLocale, useTranslations } from 'next-intl';
import { formatReviewTimeAgo } from '@/lib/format-relative-time';
import { useRef } from 'react';
import { scrollRevealProps } from '@/lib/scroll-reveal';
import { cn } from '@/lib/utils';

interface TestimonialsCarouselProps {
  reviews: ReviewPublic[];
}

export function TestimonialsCarousel({ reviews }: TestimonialsCarouselProps) {
  const t = useTranslations('home');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (reviews.length === 0) {
    return null;
  }

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'next' ? 360 : -360, behavior: 'smooth' });
  };

  return (
    <section {...scrollRevealProps('fade-up')} className="py-12 dark:bg-dm-bg sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('testimonialsTitle')}
          actionLabel={t('viewAllReviews')}
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
          {reviews.map((review) => {
            const authorName = review.author?.displayName ?? t('testimonialCompany');
            const companyName = review.company?.name ?? t('testimonialCompany');
            const companyCategory =
              getLocalizedCategoryName(review.company ?? {}, locale) ?? t('testimonialCompanyRole');

            const companyBlock = (
              <>
                <AvatarImage
                  src={review.company?.logo}
                  name={companyName}
                  variant="rounded"
                  className="h-12 w-12 shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">{companyName}</p>
                  <p className="text-xs text-ink-muted dark:text-white/85">{companyCategory}</p>
                </div>
              </>
            );

            return (
              <article
                key={review.id}
                className={cn(
                  'flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm',
                  darkCard,
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <AvatarImage
                    src={review.author?.avatarUrl}
                    name={authorName}
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate font-semibold text-ink dark:text-white">{authorName}</p>
                    <p className="text-sm text-ink-muted dark:text-white/85">
                      {formatReviewTimeAgo(review.createdAt, locale)}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} size="md" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-muted dark:text-white/90">
                  &ldquo;{review.content}&rdquo;
                </blockquote>
                <div className={cn('mt-6 border-t-2 border-slate-100 pt-4', darkBorder)}>
                  {review.company?.slug ? (
                    <Link
                      href={`/companies/${review.company.slug}`}
                      className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      {companyBlock}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">{companyBlock}</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
