import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { ReviewCard } from '@/components/review/review-card';
import { useAuth } from '@/context/auth-context';
import { ApiError, reviewsApi, usersApi } from '@/lib/api';
import { changeLanguage, getCurrentLocale } from '@/i18n';
import type { ReviewPublic, UserProfile } from '@rateq/types';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View, Alert } from 'react-native';
import { UserRole } from '@rateq/types';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const locale = getCurrentLocale();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prof, rev] = await Promise.all([
        usersApi.getProfile(),
        reviewsApi.listMine(1),
      ]);
      setProfile(prof);
      setReviews(rev.data);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof ApiError ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const toggleLanguage = async () => {
    const next = locale === 'en' ? 'ar' : 'en';
    await changeLanguage(next);
    Alert.alert(
      t('profile.language'),
      'Restart the app to apply RTL layout fully.',
    );
  };

  if (authLoading) return <LoadingView />;

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6 gap-4">
        <Text className="text-lg text-slate-600">{t('auth.loginTitle')}</Text>
        <Link href="/(auth)/login" asChild>
          <Button title={t('auth.login')} className="w-full" />
        </Link>
        <Link href="/(auth)/register" asChild>
          <Button title={t('auth.register')} variant="outline" className="w-full" />
        </Link>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16 }}>
      <View className="rounded-xl border border-slate-200 bg-white p-4">
        <Text className="text-xl font-bold text-slate-900">{profile?.email ?? user.email}</Text>
        <Text className="mt-1 text-sm text-slate-500">{user.role}</Text>
        <Text className="mt-2 text-sm">
          {user.isVerified ? t('profile.verified') : t('profile.unverified')}
        </Text>
        {profile && (
          <Text className="mt-1 text-sm text-slate-600">
            {t('profile.reviewCount')}: {profile.reviewCount}
          </Text>
        )}
      </View>

      <View className="mt-4 gap-2">
        <Button
          title={`${t('profile.language')}: ${locale.toUpperCase()}`}
          variant="outline"
          onPress={toggleLanguage}
        />
        <Button
          title={t('auth.logout')}
          variant="ghost"
          onPress={async () => {
            await logout();
            router.replace('/');
          }}
        />
      </View>

      {user.role !== UserRole.COMPANY && (
        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold">{t('profile.myReviews')}</Text>
          {loading ? (
            <Text className="text-slate-500">{t('common.loading')}</Text>
          ) : reviews.length === 0 ? (
            <Text className="text-slate-500">{t('company.noReviews')}</Text>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </View>
      )}
    </ScrollView>
  );
}
