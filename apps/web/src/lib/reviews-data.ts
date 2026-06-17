import type { PaginatedReviewsResponse, ReviewPublic } from '@rateq/types';
import { reviewsApi } from '@/lib/api';

const EMPTY_META = {
  page: 1,
  limit: 6,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export async function fetchFeaturedReviews(limit = 6): Promise<ReviewPublic[]> {
  try {
    const response = await reviewsApi.listFeatured();
    return response.data.slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchFeaturedReviewsPaginated(): Promise<PaginatedReviewsResponse> {
  try {
    return await reviewsApi.listFeatured();
  } catch {
    return { data: [], meta: EMPTY_META };
  }
}
