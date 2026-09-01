import { reviewsApi } from '@/lib/api';
import {
  EMPTY_REVIEW_STATE,
  resolveCompanyReviews,
  type CompanyReviewState,
} from '@/lib/resolve-company-reviews';

export async function fetchMyCompanyReviewState(companyId: string): Promise<CompanyReviewState> {
  const params = new URLSearchParams();
  params.set('companyId', companyId);
  params.set('limit', '20');

  try {
    const response = await reviewsApi.listMine(params);
    return resolveCompanyReviews(response.data, companyId);
  } catch {
    return EMPTY_REVIEW_STATE;
  }
}
