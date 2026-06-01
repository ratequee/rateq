import type { CompanyPublic } from '@rateq/types';
import type { ReviewPublic } from '@rateq/types';
import { CompanyReviewCard } from '@/components/company/company-review-card';
import { WriteReviewForm } from '@/components/review/write-review-form';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CompanyReviewsSectionProps {
  company: CompanyPublic;
  reviews: ReviewPublic[];
}

export async function CompanyReviewsSection({
  company,
  reviews,
}: CompanyReviewsSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');
  const tc = await getTranslations('company');

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{tc('reviews')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('reviewsSubtitle', { count: reviews.length })}</p>
        </div>
      </div>

      <div id="write-review" className="mb-6 scroll-mt-24">
        <WriteReviewForm companyId={company.id} />
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-ink-muted">
          {tc('noReviews')}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <CompanyReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}
