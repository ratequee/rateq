import { CompanyContentTabs } from '@/components/company/company-content-tabs';
import { CompanyHeroHeader } from '@/components/company/company-hero-header';
import { CompanySummarySection } from '@/components/company/company-summary-section';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { getCurrentLocale } from '@/i18n';
import {
  buildTopMentions,
  getLocalizedCompanyDescription,
  getLocalizedCompanyName,
  getSecondaryCompanyName,
} from '@/lib/company-display';
import { ApiError, companiesApi, reviewsApi } from '@/lib/api';
import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompanyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = getCurrentLocale();

  const [company, setCompany] = useState<CompanyPublic | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const c = await companiesApi.getBySlug(slug);
      const r = await reviewsApi.listByCompany(c.id);
      setCompany(c);
      setReviews(r.data);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof ApiError ? err.message : 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [slug, t, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const topMentions = useMemo(() => buildTopMentions(reviews), [reviews]);

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
            onPress={() =>
              router.push(`/review/${company.id}?name=${encodeURIComponent(displayName)}`)
            }
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
    </View>
  );
}
