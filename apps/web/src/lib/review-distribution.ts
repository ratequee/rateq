import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';

export interface RatingDistributionRow {
  stars: number;
  count: number;
  percentage: number;
}

export function buildReviewDistribution(reviews: ReviewPublic[]): RatingDistributionRow[] {
  const approved = reviews.filter((review) => review.status === ReviewStatus.APPROVED);
  const counts = [0, 0, 0, 0, 0];

  for (const review of approved) {
    const index = Math.min(5, Math.max(1, Math.round(review.rating))) - 1;
    counts[index] = (counts[index] ?? 0) + 1;
  }

  const total = approved.length || 1;
  return counts
    .map((count, index) => ({
      stars: index + 1,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .reverse();
}
