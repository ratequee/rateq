'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { reviewsApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus, UserRole } from '@rateq/types';
import { useCallback, useEffect, useState } from 'react';

const ACTIVE_REVIEW_STATUSES: ReviewStatus[] = [
  ReviewStatus.PENDING,
  ReviewStatus.RESOLUTION_PENDING,
  ReviewStatus.APPROVED,
];

function resolveCompanyReviews(reviews: ReviewPublic[], companyId: string) {
  const forCompany = reviews
    .filter((review) => review.companyId === companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myReview =
    forCompany.find((review) => ACTIVE_REVIEW_STATUSES.includes(review.status)) ?? null;

  const lastInactiveReview =
    !myReview && forCompany.some((review) => review.status === ReviewStatus.REJECTED)
      ? (forCompany.find((review) => review.status === ReviewStatus.REJECTED) ?? null)
      : null;

  return { myReview, lastInactiveReview };
}

export function useMyCompanyReview(companyId: string) {
  const { user } = useAuth();
  const [myReview, setMyReview] = useState<ReviewPublic | null>(null);
  const [lastInactiveReview, setLastInactiveReview] = useState<ReviewPublic | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshMyReview = useCallback(async () => {
    if (!user || user.role === UserRole.COMPANY) {
      setMyReview(null);
      setLastInactiveReview(null);
      return null;
    }

    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) {
        setMyReview(null);
        setLastInactiveReview(null);
        return null;
      }

      const params = new URLSearchParams();
      params.set('companyId', companyId);
      params.set('limit', '20');

      const response = await reviewsApi.listMine(token, params);
      const resolved = resolveCompanyReviews(response.data, companyId);
      setMyReview(resolved.myReview);
      setLastInactiveReview(resolved.lastInactiveReview);
      return resolved.myReview;
    } catch {
      setMyReview(null);
      setLastInactiveReview(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => {
    void refreshMyReview();
  }, [refreshMyReview]);

  return {
    myReview,
    lastInactiveReview,
    loading,
    refreshMyReview,
    setMyReview,
  };
}
