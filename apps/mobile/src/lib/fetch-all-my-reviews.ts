import { reviewsApi } from '@/lib/api';
import type { ReviewPublic } from '@rateq/types';

export async function fetchAllMyReviews(): Promise<ReviewPublic[]> {
  const all: ReviewPublic[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const params = new URLSearchParams({
      page: String(page),
      limit: '100',
    });
    const result = await reviewsApi.listMine(params);
    all.push(...result.data);
    totalPages = result.meta.totalPages;
    page += 1;
  }

  return all;
}
