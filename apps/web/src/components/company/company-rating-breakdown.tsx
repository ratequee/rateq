import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';
import { Button } from '../ui/button';

interface CompanyRatingBreakdownProps {
  reviews: ReviewPublic[];
  average: number;
}

function buildDistribution(reviews: ReviewPublic[]) {
  const approved = reviews.filter((review) => review.status === ReviewStatus.APPROVED);
  const counts = [0, 0, 0, 0, 0];

  for (const review of approved) {
    const index = Math.min(5, Math.max(1, Math.round(review.rating))) - 1;
    counts[index] = (counts[index] ?? 0) + 1;
  }

  const total = approved.length || 1;
  return counts.map((count, index) => ({
    stars: index + 1,
    count,
    percentage: Math.round((count / total) * 100),
  })).reverse();
}

export async function CompanyRatingBreakdown({
  reviews,
  average,
}: CompanyRatingBreakdownProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');
  const distribution = buildDistribution(reviews);
  const totalCount = reviews.length;

  return (
    <section className="rounded-2xl border border-slate-100 bg-brand-500 p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-5xl font-bold text-gold-500">{average.toFixed(1)}</p>
        <div className="mt-2 flex justify-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < Math.round(average) ? 'fill-gold-300 text-gold-300' : 'text-slate-300'}`}
              aria-hidden
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gold-500 sm:text-xl">{t('ratingBreakdownTitle')}</h2>
      <p className="mt-1 text-sm text-gold-500">{t('reviewCount', { count: totalCount })}</p>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-1 sm:items-center">

        <ul className="space-y-2.5">
          {distribution.map(({ stars, percentage }) => (
            <li key={stars} className="flex items-center gap-3 w-full">
              <div className="flex items-center">
              <span className="w-8 shrink-0 text-sm font-medium text-white">{stars}</span>
              <Star className="h-4 w-4 shrink-0 fill-white text-white" aria-hidden />
              </div>
              <div className="w-full overflow-hidden bg-slate-300">
                <div
                  className="h-1 max-w-100 bg-gold-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Button variant="outline" className="w-full mt-6 bg-transparent text-white border-white">
        {t('calculatedRating')}
      </Button>
    </section>
  );
}
