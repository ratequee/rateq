import { ActivityReviewCard } from '@/components/activity/activity-review-card';
import {
  ReviewStatusChips,
  type ReviewStatusFilter,
} from '@/components/activity/review-status-chips';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { getFontFamily } from '@/i18n';
import { fetchAllMyReviews } from '@/lib/fetch-all-my-reviews';
import { ApiError } from '@/lib/api';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function buildStatusCounts(reviews: ReviewPublic[]): Partial<Record<ReviewStatusFilter, number>> {
  const counts: Partial<Record<ReviewStatusFilter, number>> = { all: reviews.length };
  for (const review of reviews) {
    counts[review.status] = (counts[review.status] ?? 0) + 1;
  }
  return counts;
}

export default function ActivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setReviews([]);
      return;
    }

    try {
      setError(null);
      const data = await fetchAllMyReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }, [t, user]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const statusCounts = useMemo(() => buildStatusCounts(reviews), [reviews]);

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((review) => review.status === statusFilter);
  }, [reviews, statusFilter]);

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-dm-bg" edges={['top']}>
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-3 dark:border-dm-border dark:bg-dm-surface">
        <Text
          className="text-xl font-bold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('bold'), lineHeight: 28 }}
        >
          {t('tabs.activity')}
        </Text>
      </View>

      {!user ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="text-center text-sm text-ink-muted dark:text-white/75"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('home.activitySignIn')}
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="mt-4 rounded-full bg-brand-500 px-6 py-3"
          >
            <Text
              className="font-semibold text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('auth.login')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View className="mb-4">
              {error ? (
                <Text className="mb-3 text-center text-sm text-red-600">{error}</Text>
              ) : null}
              <ReviewStatusChips
                value={statusFilter}
                onChange={setStatusFilter}
                counts={statusCounts}
              />
              <Text
                className="mt-3 text-sm text-ink-muted dark:text-white/70"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {t('myReviews.resultsCount', { count: filteredReviews.length })}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="py-12 text-center text-sm text-ink-muted dark:text-white/70">
              {reviews.length === 0 ? t('home.activityEmpty') : t('myReviews.emptyFiltered')}
            </Text>
          }
          renderItem={({ item }) => <ActivityReviewCard review={item} />}
        />
      )}
    </SafeAreaView>
  );
}
