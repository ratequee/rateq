'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { reviewsApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus, UserRole } from '@rateq/types';
import { useCallback, useEffect, useState } from 'react';

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

const EMPTY_REVIEW_STATE: CompanyReviewState = {
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
          review.status === ReviewStatus.WITHDRAWN || review.status === ReviewStatus.REJECTED,
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

export function useMyCompanyReview(companyId: string) {
  const { user } = useAuth();
  const [reviewState, setReviewState] = useState<CompanyReviewState>(EMPTY_REVIEW_STATE);
  const [loading, setLoading] = useState(false);

  const refreshMyReview = useCallback(async (): Promise<CompanyReviewState> => {
    if (!user || user.role === UserRole.COMPANY) {
      setReviewState(EMPTY_REVIEW_STATE);
      return EMPTY_REVIEW_STATE;
    }

    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) {
        setReviewState(EMPTY_REVIEW_STATE);
        return EMPTY_REVIEW_STATE;
      }

      const params = new URLSearchParams();
      params.set('companyId', companyId);
      params.set('limit', '20');

      const response = await reviewsApi.listMine(token, params);
      const resolved = resolveCompanyReviews(response.data, companyId);
      setReviewState(resolved);
      return resolved;
    } catch {
      setReviewState(EMPTY_REVIEW_STATE);
      return EMPTY_REVIEW_STATE;
    } finally {
      setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => {
    void refreshMyReview();
  }, [refreshMyReview]);

  const setMyReview = useCallback((review: ReviewPublic | null) => {
    setReviewState((current) => ({
      ...current,
      myReview: review,
      publishedReview: review?.status === ReviewStatus.APPROVED ? review : current.publishedReview,
      inFlightReview:
        review && IN_FLIGHT_REVIEW_STATUSES.includes(review.status)
          ? review
          : current.inFlightReview,
      canWriteNewReview:
        review?.status === ReviewStatus.APPROVED
          ? false
          : review && IN_FLIGHT_REVIEW_STATUSES.includes(review.status)
            ? false
            : current.canWriteNewReview,
    }));
  }, []);

  return {
    ...reviewState,
    loading,
    refreshMyReview,
    setMyReview,
  };
}
