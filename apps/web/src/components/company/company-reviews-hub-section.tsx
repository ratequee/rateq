import { CompanyReviewsHubClient } from '@/components/company/company-reviews-hub-client';
import { CompanyReviewsSummaryCard } from '@/components/company/company-reviews-summary-card';
import type { CompanyPublic } from '@rateq/types';
import type { ReviewPublic } from '@rateq/types';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CompanyReviewsHubSectionProps {
  company: CompanyPublic;
  reviews: ReviewPublic[];
}

function buildTopMentions(reviews: ReviewPublic[]): string[] {
  const phrases = reviews.map((review) => {
    const words = review.title.trim().split(/\s+/);
    if (words.length <= 3) return review.title;
    return words.slice(0, 3).join(' ');
  });

  return [...new Set(phrases)].slice(0, 6);
}

export async function CompanyReviewsHubSection({
  company,
  reviews,
}: CompanyReviewsHubSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage.reviewsHub');
  const tc = await getTranslations('company');
  const topMentions = buildTopMentions(reviews);

  return (
    <section
      id="reviews-hub"
      className="scroll-mt-24 py-12 sm:py-16 lg:py-20"
      aria-labelledby="reviews-hub-heading"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 id="reviews-hub-heading" className="text-2xl font-bold text-ink sm:text-3xl">
            {tc('reviews')}
          </h2>
          <p className="mt-2 text-sm text-ink-muted sm:text-base">
            {t('subtitle', { name: company.name, count: reviews.length })}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="w-full shrink-0 lg:w-[280px] xl:w-[300px]">
            <CompanyReviewsSummaryCard reviews={reviews} average={company.ratingAverage} />
          </div>
          <div className="min-w-0 flex-1">
            <CompanyReviewsHubClient reviews={reviews} topMentions={topMentions} />
          </div>
        </div>
      </div>
    </section>
  );
}
