import { Logo } from '@/components/brand/logo';
import { FeaturedCompanyCard } from '@/components/home/featured-company-card';
import { TrustedHomeBanner } from '@/components/home/trusted-home-banner';
import { HomeCategoryCard } from '@/components/home/home-category-card';
import { HomeTestimonialCard } from '@/components/home/home-testimonial-card';
import { ScreenHeaderControls } from '@/components/layout/screen-header-controls';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { ApiError, categoriesApi, companiesApi, reviewsApi } from '@/lib/api';
import type { CategoryPublic, CompanyPublic, ReviewPublic, TrustedBannerItem } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { textStyle, textAlignClass, labelContainerStyle } = useAppDirection();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [trustedBanner, setTrustedBanner] = useState<TrustedBannerItem[]>([]);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [cats, companiesResult, featuredReviews, trusted] = await Promise.all([
        categoriesApi.list(),
        companiesApi.search(new URLSearchParams({ sort: 'rating', limit: '6' })),
        reviewsApi.listFeatured(),
        companiesApi.getTrustedBanner(),
      ]);
      setCategories(cats);
      setCompanies(companiesResult.data);
      setReviews(featuredReviews.data);
      setTrustedBanner(trusted);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }, [t]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onSearch = () => {
    Keyboard.dismiss();
    router.push({
      pathname: '/(tabs)/companies',
      params: query.trim() ? { q: query.trim() } : undefined,
    });
  };

  if (loading) return <LoadingView />;

  const heroImage = companies.find((company) => company.coverUrl)?.coverUrl;
  const gridCategories = categories.slice(0, 6);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-dm-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pb-2 pt-2">
          <View className="flex-row items-center justify-between">
            <Logo width={92} height={22} />
            <ScreenHeaderControls />
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            <Input
              className="flex-1 rounded-full border-slate-200"
              placeholder={t('home.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
            <Pressable
              onPress={onSearch}
              className="h-12 w-12 items-center justify-center rounded-full bg-brand-500"
            >
              <Ionicons name="search" size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {error ? <Text className="px-4 py-2 text-center text-sm text-red-600">{error}</Text> : null}

        {trustedBanner.length > 0 ? (
          <TrustedHomeBanner items={trustedBanner} />
        ) : (
          <View className="px-4">
            {heroImage ? (
              <ImageBackground
                source={{ uri: heroImage }}
                className="mt-2 overflow-hidden rounded-3xl"
                imageStyle={{ borderRadius: 24 }}
              >
                <View className="min-h-[160px] justify-end bg-black/35 p-5">
                  <Text
                    className={cn('text-2xl font-bold leading-8 text-white', textAlignClass)}
                    style={[{ fontFamily: getFontFamily('bold') }, textStyle]}
                  >
                    {t('home.heroTitlePrefix')}{' '}
                    <Text className="text-gold-300">{t('home.heroTitleHighlight')}</Text>{' '}
                    {t('home.heroTitleSuffix')}
                  </Text>
                </View>
              </ImageBackground>
            ) : (
              <View className="mt-2 min-h-[160px] justify-end rounded-3xl bg-brand-600 p-5">
                <Text
                  className={cn('text-2xl font-bold leading-8 text-white', textAlignClass)}
                  style={[{ fontFamily: getFontFamily('bold') }, textStyle]}
                >
                  {t('home.heroTitlePrefix')}{' '}
                  <Text className="text-gold-300">{t('home.heroTitleHighlight')}</Text>{' '}
                  {t('home.heroTitleSuffix')}
                </Text>
              </View>
            )}
          </View>
        )}

        <View className="mt-8 px-3">
          <View className="mb-3 flex-row items-center justify-between px-1">
            <Text
              className={cn('text-lg font-bold text-ink dark:text-white', textAlignClass)}
              style={[{ fontFamily: getFontFamily('bold') }, textStyle]}
            >
              {t('home.categoriesTitle')}
            </Text>
            <Pressable onPress={() => router.push('/categories')}>
              <Text
                className={cn('text-sm font-medium text-brand-500', textAlignClass)}
                style={[{ fontFamily: getFontFamily('medium') }, textStyle]}
              >
                {t('home.viewAllCategories')}
              </Text>
            </Pressable>
          </View>

          {gridCategories.length === 0 ? (
            <Text className="py-6 text-center text-sm text-ink-muted dark:text-white/70">
              {t('home.noCategories')}
            </Text>
          ) : (
            <View className="flex-row flex-wrap">
              {gridCategories.map((category) => (
                <HomeCategoryCard
                  key={category.id}
                  category={category}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/companies',
                      params: { categoryId: category.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>

        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between px-4">
            <Text
              className={cn('text-lg font-bold text-ink dark:text-white', textAlignClass)}
              style={[{ fontFamily: getFontFamily('bold') }, textStyle]}
            >
              {t('home.featuredTitle')}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/companies')}>
              <Text
                className={cn('text-sm font-medium text-brand-500', textAlignClass)}
                style={[{ fontFamily: getFontFamily('medium') }, textStyle]}
              >
                {t('home.viewAllCompanies')}
              </Text>
            </Pressable>
          </View>

          {companies.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-ink-muted dark:text-white/70">
              {t('common.noResults')}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
            >
              {companies.map((company) => (
                <FeaturedCompanyCard key={company.id} company={company} />
              ))}
            </ScrollView>
          )}
        </View>

        {reviews.length > 0 ? (
          <View className="mt-8 pb-8">
            <View className="mb-3 px-4" style={labelContainerStyle}>
              <Text
                className="text-lg font-bold text-ink dark:text-white"
                style={[{ fontFamily: getFontFamily('bold') }, textStyle]}
              >
                {t('home.testimonialsTitle')}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            >
              {reviews.map((review) => (
                <HomeTestimonialCard key={review.id} review={review} />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
