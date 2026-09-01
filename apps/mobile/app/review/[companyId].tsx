import { ReviewerReviewStatusCard } from '@/components/review/reviewer-review-status-card';
import { ReviewScreenLayout } from '@/components/review/review-screen-layout';
import { WriteReviewForm } from '@/components/review/write-review-form';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { fetchMyCompanyReviewState } from '@/lib/fetch-my-company-review';
import { truncateWords } from '@/lib/format-text';
import { useAppToast } from '@/hooks/use-app-toast';
import type { CompanyReviewState } from '@/lib/resolve-company-reviews';
import { UserRole } from '@rateq/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SubmitReviewScreen() {
  const { companyId, name } = useLocalSearchParams<{
    companyId: string;
    name?: string;
  }>();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { onboarding } = useProfile();
  const router = useRouter();
  const toast = useAppToast();
  const [reviewState, setReviewState] = useState<CompanyReviewState | null>(null);
  const [loadingState, setLoadingState] = useState(true);

  const loadReviewState = useCallback(async () => {
    if (!companyId || !user) return;
    setLoadingState(true);
    try {
      const state = await fetchMyCompanyReviewState(companyId);
      setReviewState(state);
    } finally {
      setLoadingState(false);
    }
  }, [companyId, user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
      return;
    }

    if (!isLoading && user) {
      if (user.role === UserRole.COMPANY || onboarding?.company?.id === companyId) {
        toast.error(t('review.cannotReviewOwn'));
        router.back();
        return;
      }

      if (!user.isVerified) {
        toast.error(t('auth.verifyNotice'));
        router.back();
        return;
      }

      void loadReviewState();
    }
  }, [user, isLoading, router, companyId, onboarding?.company?.id, loadReviewState, t, toast]);

  if (isLoading || !user || loadingState || !companyId) {
    return <LoadingView />;
  }

  const blockedReview = reviewState?.publishedReview ?? reviewState?.inFlightReview;
  const bannerMessage = reviewState?.publishedReview
    ? t('review.publishedReviewBlocksNew')
    : reviewState?.inFlightReview
      ? t('review.alreadyReviewed')
      : null;

  const companyName = name ?? t('review.submit');
  const shortCompanyName = truncateWords(companyName, 3);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewScreenLayout
        title={blockedReview ? t('review.existingReviewTitle') : t('review.writeTitle')}
        subtitle={
          blockedReview
            ? shortCompanyName
            : t('review.writeSubtitle', { company: shortCompanyName })
        }
      >
        {blockedReview ? (
          <ReviewerReviewStatusCard
            review={blockedReview}
            bannerMessage={bannerMessage ?? undefined}
          />
        ) : (
          <WriteReviewForm
            companyId={companyId}
            lastInactiveReview={reviewState?.lastInactiveReview}
            onSubmitted={() => router.back()}
          />
        )}
      </ReviewScreenLayout>
    </>
  );
}
