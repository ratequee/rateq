import type { ReviewPublic } from '@rateq/types';
import { buildReviewDistribution } from '@/lib/review-distribution';
import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CompanyReviewsSummaryCardProps {
  reviews: ReviewPublic[];
  average: number;
}

export async function CompanyReviewsSummaryCard({
  reviews,
  average,
}: CompanyReviewsSummaryCardProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage.reviewsHub');
  const distribution = buildReviewDistribution(reviews);

  return (
    <aside className="h-auto w-full self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Star className="h-10 w-10 shrink-0 fill-gold-500 text-gold-500" aria-hidden />
        <p className="text-5xl font-bold leading-none text-ink">{average.toFixed(1)}</p>
      </div>
      <p className="mt-3 text-base font-semibold text-ink">{t('allReviews')}</p>

      <ul className="mt-6 space-y-3">
        {distribution.map(({ stars, percentage }) => (
          <li key={stars} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-sm font-medium text-ink">{stars}</span>
            <Star className="h-4 w-4 shrink-0 fill-gold-500 text-gold-500" aria-hidden />
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gold-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
