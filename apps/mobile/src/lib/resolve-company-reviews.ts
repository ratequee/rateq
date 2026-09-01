import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';

const IN_FLIGHT_REVIEW_STATUSES: ReviewStatus[] = [
  ReviewStatus.PENDING,
  ReviewStatus.RESOLUTION_PENDING,
  ReviewStatus.MODIFIED,
  ReviewStatus.PROCEEDED,
];

export interface CompanyReviewState {
  publishedReview: ReviewPublic | null;
  inFlightReview: ReviewPublic | null;
  myReview: ReviewPublic | null;
  lastInactiveReview: ReviewPublic | null;
  canWriteNewReview: boolean;
}

export const EMPTY_REVIEW_STATE: CompanyReviewState = {
  publishedReview: null,
  inFlightReview: null,
  myReview: null,
  lastInactiveReview: null,
  canWriteNewReview: true,
};

export function resolveCompanyReviews(
  reviews: ReviewPublic[],
  companyId: string,
): CompanyReviewState {
  const forCompany = reviews
    .filter((review) => review.companyId === companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const publishedReview =
    forCompany.find((review) => review.status === ReviewStatus.APPROVED) ?? null;
  const inFlightReview =
    forCompany.find((review) => IN_FLIGHT_REVIEW_STATUSES.includes(review.status)) ?? null;
  const myReview = publishedReview ?? inFlightReview;
  const canWriteNewReview = !publishedReview && !inFlightReview;

  const lastInactiveReview = canWriteNewReview
    ? (forCompany.find(
        (review) =>
          review.status === ReviewStatus.WITHDRAWN ||
          review.status === ReviewStatus.REJECTED ||
          review.status === ReviewStatus.DELETED,
      ) ?? null)
    : null;

  return {
    publishedReview,
    inFlightReview,
    myReview,
    lastInactiveReview,
    canWriteNewReview,
  };
}
