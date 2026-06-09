'use client';

import { CompanyReviewsHubClient } from '@/components/company/company-reviews-hub-client';
import { CompanyReviewsSummaryCard } from '@/components/company/company-reviews-summary-card';
import { cn } from '@/lib/utils';
import type { ReviewPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface CompanyReviewsHubLayoutProps {
  reviews: ReviewPublic[];
  topMentions: string[];
  average: number;
}

export function CompanyReviewsHubLayout({
  reviews,
  topMentions,
  average,
}: CompanyReviewsHubLayoutProps) {
  const t = useTranslations('companyPage.reviewsHub');
  const [activeMention, setActiveMention] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleMentionClick = (mention: string) => {
    setActiveMention((current) => (current === mention ? null : mention));
    setPage(1);
  };

  return (
    <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start lg:gap-10">
      <div className="w-full shrink-0 lg:w-[280px] xl:w-[300px]">
        <CompanyReviewsSummaryCard reviews={reviews} average={average} />
        {topMentions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-ink">{t('topMentions')}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {topMentions.map((mention) => (
                <button
                  key={mention}
                  type="button"
                  onClick={() => handleMentionClick(mention)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    activeMention === mention
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-transparent bg-slate-100 text-ink-muted hover:bg-slate-200',
                  )}
                >
                  {mention}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <CompanyReviewsHubClient
          reviews={reviews}
          activeMention={activeMention}
          page={page}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
