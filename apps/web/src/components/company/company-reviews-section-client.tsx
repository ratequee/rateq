'use client';

import { WriteReviewForm } from '@/components/review/write-review-form';
import { ReviewerReviewStatusCard } from '@/components/company/reviewer-review-status-card';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { OPEN_WRITE_REVIEW_EVENT } from '@/lib/write-review-events';
import { useMyCompanyReview } from '@/lib/use-my-company-review';
import type { CategoryServicePublic, CompanyPublic, ReviewPublic } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

const EMPTY_CATEGORY_SERVICES: CategoryServicePublic[] = [];

interface CompanyReviewsSectionClientProps {
  company: CompanyPublic;
  initialReviews: ReviewPublic[];
  categoryServices?: CategoryServicePublic[];
}

type ReviewPanel = 'form' | 'already-reviewed' | 'login' | 'cannot-own' | 'verify';

export function CompanyReviewsSectionClient({
  company,
  initialReviews,
  categoryServices = EMPTY_CATEGORY_SERVICES,
}: CompanyReviewsSectionClientProps) {
  const tr = useTranslations('review');
  const ta = useTranslations('auth');
  const tn = useTranslations('nav');
  const { user } = useAuth();
  const { onboarding } = useProfile();
  const [reviews, setReviews] = useState(initialReviews);
  const [panel, setPanel] = useState<ReviewPanel | null>(null);
  const { myReview, lastInactiveReview, refreshMyReview, setMyReview } = useMyCompanyReview(
    company.id,
  );

  const isOwner = onboarding?.company?.id === company.id;

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

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

    const existing = myReview ?? (await refreshMyReview());
    if (existing) {
      setPanel('already-reviewed');
      return;
    }

    setPanel('form');
  }, [isOwner, myReview, refreshMyReview, user]);

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

  const handleReviewSubmitted = useCallback(
    (review: ReviewPublic) => {
      setMyReview(review);
      setPanel(null);
      setReviews((current) => {
        if (current.some((item) => item.id === review.id)) {
          return current.map((item) => (item.id === review.id ? review : item));
        }
        return [review, ...current];
      });
    },
    [setMyReview],
  );

  const panelContent = useMemo(() => {
    if (!panel) return null;

    switch (panel) {
      case 'already-reviewed':
        return myReview ? (
          <div className="space-y-3">
            <ReviewerReviewStatusCard review={myReview} />
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                {tr('dismiss')}
              </Button>
            </div>
          </div>
        ) : (
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
  }, [myReview, panel, ta, tn, tr]);

  return (
    <section id="reviews">
      <div id="write-review" className="mb-6 scroll-mt-1 space-y-4">
        {myReview && panel !== 'form' ? <ReviewerReviewStatusCard review={myReview} /> : null}
        {lastInactiveReview && !myReview && panel !== 'form' ? (
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-muted">{tr('reviewAgainHint')}</p>
              <Button
                type="button"
                variant="outline-brand"
                size="sm"
                onClick={() => void openWriteReview()}
              >
                {tr('reviewAgain')}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        {panel === 'form' ? (
          <WriteReviewForm
            companyId={company.id}
            categoryId={company.categoryId}
            categoryServices={categoryServices}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => setPanel(null)}
          />
        ) : null}
        {panelContent}
      </div>
    </section>
  );
}
