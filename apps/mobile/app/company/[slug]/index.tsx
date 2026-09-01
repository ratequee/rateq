import { ReviewStatusModal } from '@/components/review/review-status-modal';
import { CompanyContentTabs } from '@/components/company/company-content-tabs';
import { CompanyHeroHeader } from '@/components/company/company-hero-header';
import { CompanySummarySection } from '@/components/company/company-summary-section';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { getCurrentLocale } from '@/i18n';
import {
  buildTopMentions,
  getLocalizedCompanyDescription,
  getLocalizedCompanyName,
  getSecondaryCompanyName,
} from '@/lib/company-display';
import { fetchMyCompanyReviewState } from '@/lib/fetch-my-company-review';
import { useAppToast } from '@/hooks/use-app-toast';
import { companiesApi, reviewsApi } from '@/lib/api';
import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompanyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { onboarding } = useProfile();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = getCurrentLocale();
  const toast = useAppToast();

  const [company, setCompany] = useState<CompanyPublic | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingReview, setCheckingReview] = useState(false);
  const [statusReview, setStatusReview] = useState<ReviewPublic | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const c = await companiesApi.getBySlug(slug);
      const r = await reviewsApi.listByCompany(c.id);
      setCompany(c);
      setReviews(r.data);
    } catch (err) {
      toast.apiError(err, 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [slug, toast, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const topMentions = useMemo(() => buildTopMentions(reviews), [reviews]);

  const isOwner = onboarding?.company?.id === company?.id;

  const handleWriteReview = useCallback(async () => {
    if (!company) return;

    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    if (user.role === UserRole.COMPANY || isOwner) {
      toast.error(t('review.cannotReviewOwn'));
      return;
    }

    if (!user.isVerified) {
      toast.error(t('auth.verifyNotice'));
      return;
    }

    setCheckingReview(true);
    try {
      const state = await fetchMyCompanyReviewState(company.id);

      if (state.publishedReview) {
        setStatusReview(state.publishedReview);
        setStatusBanner(t('review.publishedReviewBlocksNew'));
        setStatusModalOpen(true);
        return;
      }

      if (state.inFlightReview) {
        setStatusReview(state.inFlightReview);
        setStatusBanner(t('review.alreadyReviewed'));
        setStatusModalOpen(true);
        return;
      }

      router.push({
        pathname: '/review/[companyId]',
        params: {
          companyId: company.id,
          name: getLocalizedCompanyName(company, locale),
          ...(state.lastInactiveReview ? { hasInactive: '1' } : {}),
        },
      });
    } finally {
      setCheckingReview(false);
    }
  }, [company, user, isOwner, router, t, locale, toast]);

  if (loading || !company) return <LoadingView />;

  const displayName = getLocalizedCompanyName(company, locale);
  const secondaryName = getSecondaryCompanyName(company, locale);
  const description = getLocalizedCompanyDescription(company, locale);

  const canReview = user && user.role !== UserRole.COMPANY && user.isVerified;
  const bottomPadding = canReview ? 88 + insets.bottom : 24 + insets.bottom;

  return (
    <View className="flex-1 bg-white dark:bg-dm-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <CompanyHeroHeader company={company} displayName={displayName} />
        <CompanySummarySection
          company={company}
          displayName={displayName}
          secondaryName={secondaryName}
          description={description}
        />
        <CompanyContentTabs company={company} reviews={reviews} topMentions={topMentions} />
      </ScrollView>

      {canReview ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 pt-3 dark:border-dm-border dark:bg-dm-surface"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            title={t('company.writeReview')}
            onPress={() => void handleWriteReview()}
            loading={checkingReview}
            className="h-12 rounded-full"
          />
        </View>
      ) : null}

      {user && !user.isVerified && user.role !== UserRole.COMPANY ? (
        <View
          className="absolute left-4 right-4"
          style={{ bottom: canReview ? 88 + insets.bottom : 16 }}
        >
          <Text className="text-center text-xs text-amber-700">{t('auth.verifyNotice')}</Text>
        </View>
      ) : null}

      <ReviewStatusModal
        visible={statusModalOpen}
        review={statusReview}
        bannerMessage={statusBanner}
        onClose={() => {
          setStatusModalOpen(false);
          setStatusReview(null);
          setStatusBanner(null);
        }}
      />
    </View>
  );
}
