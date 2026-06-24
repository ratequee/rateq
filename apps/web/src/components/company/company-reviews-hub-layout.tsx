'use client';

import { CompanyReviewsHubClient } from '@/components/company/company-reviews-hub-client';
import { CompanyReviewsSummaryCard } from '@/components/company/company-reviews-summary-card';
import { useMyCompanyReview } from '@/lib/use-my-company-review';
import { cn } from '@/lib/utils';
import type { ReviewPublic, ReviewRatingDistribution } from '@rateq/types';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

interface CompanyReviewsHubLayoutProps {
  companyId: string;
  reviews: ReviewPublic[];
  topMentions: string[];
  average: number;
  reviewCount: number;
  distribution: ReviewRatingDistribution;
}

export function CompanyReviewsHubLayout({
  companyId,
  reviews,
  topMentions,
  average,
  reviewCount,
  distribution,
}: CompanyReviewsHubLayoutProps) {
  const t = useTranslations('companyPage.reviewsHub');
  const [activeMention, setActiveMention] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { myReview } = useMyCompanyReview(companyId);

  const displayReviews = useMemo(() => {
    if (!myReview) return reviews;
    if (reviews.some((review) => review.id === myReview.id)) {
      return reviews.map((review) => (review.id === myReview.id ? myReview : review));
    }
    return [myReview, ...reviews];
  }, [myReview, reviews]);

  const handleMentionClick = (mention: string) => {
    setActiveMention((current) => (current === mention ? null : mention));
    setPage(1);
  };

  return (
    <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start lg:gap-10">
      <div className="w-full shrink-0 lg:w-[280px] xl:w-[300px]">
        <CompanyReviewsSummaryCard
          average={average}
          reviewCount={reviewCount}
          distribution={distribution}
        />
        {topMentions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-primary">{t('topMentions')}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {topMentions.map((mention) => (
                <button
                  key={mention}
                  type="button"
                  onClick={() => handleMentionClick(mention)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    activeMention === mention
                      ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300'
                      : 'border-transparent bg-slate-100 text-secondary hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700',
                  )}
                >
                  {mention}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-6">
        <CompanyReviewsHubClient
          reviews={displayReviews}
          activeMention={activeMention}
          page={page}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
