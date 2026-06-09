'use client';

import { WriteReviewForm } from '@/components/review/write-review-form';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { reviewsApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { OPEN_WRITE_REVIEW_EVENT } from '@/lib/write-review-events';
import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CompanyReviewsSectionClientProps {
  company: CompanyPublic;
  initialReviews: ReviewPublic[];
}

type ReviewPanel = 'form' | 'already-reviewed' | 'login' | 'cannot-own' | 'verify';

export function CompanyReviewsSectionClient({
  company,
  initialReviews,
}: CompanyReviewsSectionClientProps) {
  const tr = useTranslations('review');
  const ta = useTranslations('auth');
  const tn = useTranslations('nav');
  const { user } = useAuth();
  const { onboarding } = useProfile();
  const [reviews, setReviews] = useState(initialReviews);
  const [panel, setPanel] = useState<ReviewPanel | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const isOwner = onboarding?.company?.id === company.id;

  const loadOwnerReviews = useCallback(async () => {
    if (!isOwner || !user) return;

    try {
      const token = await ensureValidAccessToken();
      if (!token) return;

      const response = await reviewsApi.listByCompanyManage(token, company.id);
      setReviews(response.data);
    } catch {
      // Keep public list on failure
    }
  }, [company.id, isOwner, user]);

  const checkExistingReview = useCallback(async () => {
    if (!user) {
      setHasExistingReview(false);
      return false;
    }

    const inList = reviews.some((review) => review.userId === user.id);
    if (inList) {
      setHasExistingReview(true);
      return true;
    }

    try {
      const token = await ensureValidAccessToken();
      if (!token) return false;

      const response = await reviewsApi.listMine(token);
      const existing = response.data.some((review) => review.companyId === company.id);
      setHasExistingReview(existing);
      return existing;
    } catch {
      return inList;
    }
  }, [company.id, reviews, user]);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    void loadOwnerReviews();
  }, [loadOwnerReviews]);

  useEffect(() => {
    void checkExistingReview();
  }, [checkExistingReview]);

  const openWriteReview = useCallback(async () => {
    if (!user) {
      setPanel('login');
      return;
    }

    if (user.role === UserRole.COMPANY || isOwner) {
      setPanel('cannot-own');
      return;
    }

    if (!user.isVerified) {
      setPanel('verify');
      return;
    }

    const alreadyReviewed = hasExistingReview || (await checkExistingReview());
    if (alreadyReviewed) {
      setPanel('already-reviewed');
      return;
    }

    setPanel('form');
  }, [checkExistingReview, hasExistingReview, isOwner, user]);

  useEffect(() => {
    const handleOpen = () => {
      void openWriteReview();
    };

    window.addEventListener(OPEN_WRITE_REVIEW_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_WRITE_REVIEW_EVENT, handleOpen);
  }, [openWriteReview]);

  useEffect(() => {
    if (window.location.hash !== '#write-review') return;
    void openWriteReview();
  }, [openWriteReview]);

  const handleReviewSubmitted = useCallback((review: ReviewPublic) => {
    setHasExistingReview(true);
    setPanel(null);
    setReviews((current) => {
      if (current.some((item) => item.id === review.id)) {
        return current.map((item) => (item.id === review.id ? review : item));
      }
      return [review, ...current];
    });
  }, []);

  const panelContent = useMemo(() => {
    if (!panel) return null;

    switch (panel) {
      case 'form':
        return (
          <WriteReviewForm
            companyId={company.id}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => setPanel(null)}
          />
        );
      case 'already-reviewed':
        return (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-900">{tr('alreadyReviewed')}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                {tr('dismiss')}
              </Button>
            </CardContent>
          </Card>
        );
      case 'login':
        return (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-muted">{tr('loginToReview')}</p>
              <Link href="/login">
                <Button variant="outline-brand" size="sm">
                  {tn('login')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      case 'cannot-own':
        return (
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 text-sm text-ink-muted">
              {tr('cannotReviewOwn')}
            </CardContent>
          </Card>
        );
      case 'verify':
        return (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">{ta('verifyNotice')}</CardContent>
          </Card>
        );
      default:
        return null;
    }
  }, [company.id, handleReviewSubmitted, panel, ta, tn, tr]);

  return (
    <section id="reviews">
      <div id="write-review" className="mb-6 scroll-mt-1">
        {panelContent}
      </div>
    </section>
  );
}
