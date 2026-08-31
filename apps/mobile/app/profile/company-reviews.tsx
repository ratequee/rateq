import { ActivityReviewCard } from '@/components/activity/activity-review-card';
import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { LoadingView } from '@/components/ui/loading-view';
import { useProfile } from '@/context/profile-context';
import { getFontFamily } from '@/i18n';
import { ApiError, reviewsApi } from '@/lib/api';
import type { ReviewPublic } from '@rateq/types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Text } from 'react-native';

export default function ProfileCompanyReviewsScreen() {
  const { t } = useTranslation();
  const { onboarding } = useProfile();
  const companyId = onboarding?.company?.id;
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      const result = await reviewsApi.listByCompanyManage(companyId, params);
      setReviews(result.data);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingView />;

  if (!companyId) {
    return (
      <ProfileSubscreenLayout title={t('profile.companyReviews.title')}>
        <Text
          className="p-6 text-center text-sm text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('profile.companyReviews.noCompany')}
        </Text>
      </ProfileSubscreenLayout>
    );
  }

  return (
    <ProfileSubscreenLayout title={t('profile.companyReviews.title')}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <Text
            className="py-12 text-center text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('profile.companyReviews.empty')}
          </Text>
        }
        renderItem={({ item }) => <ActivityReviewCard review={item} />}
      />
    </ProfileSubscreenLayout>
  );
}
