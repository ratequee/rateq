'use client';

import { WriteReviewForm } from '@/components/review/write-review-form';
import { ReviewerReviewStatusCard } from '@/components/company/reviewer-review-status-card';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useRouter } from '@/i18n/routing';
import { OPEN_WRITE_REVIEW_EVENT } from '@/lib/write-review-events';
import { useMyCompanyReview } from '@/lib/use-my-company-review';
import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CompanyReviewsSectionClientProps {
  company: CompanyPublic;
}

type ReviewPanel = 'form' | 'already-reviewed' | 'login' | 'cannot-own' | 'verify';

export function CompanyReviewsSectionClient({ company }: CompanyReviewsSectionClientProps) {
  const tr = useTranslations('review');
  const ta = useTranslations('auth');
  const tn = useTranslations('nav');
  const router = useRouter();
  const { user } = useAuth();
  const { onboarding } = useProfile();
  const [panel, setPanel] = useState<ReviewPanel | null>(null);
  const { myReview, lastInactiveReview, refreshMyReview, setMyReview } = useMyCompanyReview(
    company.id,
  );

  const isOwner = onboarding?.company?.id === company.id;
  const companyServices = company.serviceItems ?? [];

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
      router.refresh();
    },
    [router, setMyReview],
  );

  const panelContent = useMemo(() => {
    if (!panel) return null;

    switch (panel) {
      case 'already-reviewed':
        return (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-900 dark:text-amber-200">{tr('alreadyReviewed')}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(null)}>
                {tr('dismiss')}
              </Button>
            </CardContent>
          </Card>
        );
      case 'login':
        return (
          <Card className="border-subtle">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary">{tr('loginToReview')}</p>
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
          <Card className="border-subtle surface-muted">
            <CardContent className="p-4 text-sm text-secondary">
              {tr('cannotReviewOwn')}
            </CardContent>
          </Card>
        );
      case 'verify':
        return (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200">
              {ta('verifyNotice')}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }, [panel, ta, tn, tr]);

  return (
    <section id="reviews">
      <div id="write-review" className="mb-6 scroll-mt-1 space-y-4">
        {myReview && panel !== 'form' && panel !== 'already-reviewed' ? (
          <ReviewerReviewStatusCard review={myReview} />
        ) : null}
        {lastInactiveReview && !myReview && panel !== 'form' ? (
          <Card className="border-subtle surface-muted">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary">{tr('reviewAgainHint')}</p>
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
            key={companyServices.map((service) => service.id).join(',')}
            companyId={company.id}
            companyServices={companyServices}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => setPanel(null)}
          />
        ) : null}
        {panelContent}
      </div>
    </section>
  );
}
