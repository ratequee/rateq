import type { ReviewRatingDistribution } from '@rateq/types';

export interface RatingDistributionRow {
  stars: number;
  count: number;
  percentage: number;
}

export const EMPTY_RATING_DISTRIBUTION: ReviewRatingDistribution = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

export function buildReviewDistributionFromCounts(
  distribution: ReviewRatingDistribution,
  totalCount?: number,
): RatingDistributionRow[] {
  const distributionTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const total = totalCount ?? (distributionTotal || 1);

  return [5, 4, 3, 2, 1].map((stars) => {
    const count = distribution[stars as keyof ReviewRatingDistribution] ?? 0;
    return {
      stars,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}
