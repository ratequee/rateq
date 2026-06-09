'use client';

import type { ReviewPublic } from '@rateq/types';
import { buildReviewDistribution } from '@/lib/review-distribution';
import { Star } from 'lucide-react';

interface CompanyReviewsSummaryCardProps {
  reviews: ReviewPublic[];
  average: number;
}

export function CompanyReviewsSummaryCard({ reviews, average }: CompanyReviewsSummaryCardProps) {
  const distribution = buildReviewDistribution(reviews);

  return (
    <aside className="h-auto w-full self-start rounded-2xl border border-brand-500 bg-brand-500 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Star className="h-10 w-10 shrink-0 fill-gold-500 text-gold-500" aria-hidden />
        <p className="text-5xl font-bold leading-none text-white">{average.toFixed(1)}</p>
      </div>

      <ul className="mt-6 space-y-3">
        {distribution.map(({ stars, percentage }) => (
          <li key={stars} className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded bg-slate-200" />
            <span className="w-4 shrink-0 text-sm font-medium text-white">{stars}</span>
            <Star className="h-4 w-4 shrink-0 fill-white text-white" aria-hidden />
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
