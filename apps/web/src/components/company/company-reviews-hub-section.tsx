import { CompanyReviewsHubLayout } from '@/components/company/company-reviews-hub-layout';
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
      className="scroll-mt-14 pb-12 sm:pb-16 lg:pb-20"
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

        <CompanyReviewsHubLayout
          reviews={reviews}
          topMentions={topMentions}
          average={company.ratingAverage}
        />
      </div>
    </section>
  );
}
