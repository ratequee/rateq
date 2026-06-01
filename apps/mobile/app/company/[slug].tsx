import { ReviewCard } from '@/components/review/review-card';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/context/auth-context';
import { ApiError, companiesApi, reviewsApi } from '@/lib/api';
import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';

export default function CompanyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
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

  if (loading || !company) return <LoadingView />;

  const canReview =
    user &&
    user.role !== UserRole.COMPANY &&
    user.isVerified;

  return (
    <>
      <Stack.Screen options={{ title: company.name }} />
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16 }}>
        <View className="rounded-xl border border-slate-200 bg-white p-4">
          <Text className="text-2xl font-bold text-slate-900">{company.name}</Text>
          <Text className="mt-1 text-slate-500">
            {company.city}, {company.country}
          </Text>
          <View className="mt-3 flex-row items-center gap-3">
            <StarRating value={company.ratingAverage} />
            <Text className="text-sm text-slate-500">
              {company.reviewCount} {t('common.reviews')}
            </Text>
          </View>
          {company.description && (
            <Text className="mt-4 text-slate-600 leading-6">{company.description}</Text>
          )}
        </View>

        {canReview && (
          <View className="mt-4">
            <Button
              title={t('company.writeReview')}
              onPress={() =>
                router.push(
                  `/review/${company.id}?name=${encodeURIComponent(company.name)}`,
                )
              }
            />
          </View>
        )}

        {user && !user.isVerified && user.role !== UserRole.COMPANY && (
          <Text className="mt-4 text-sm text-amber-700">{t('auth.verifyNotice')}</Text>
        )}

        <Text className="mt-6 mb-3 text-lg font-semibold">{t('company.reviews')}</Text>
        {reviews.length === 0 ? (
          <Text className="text-slate-500">{t('company.noReviews')}</Text>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </ScrollView>
    </>
  );
}
