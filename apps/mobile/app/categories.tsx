import { HomeCategoryCard } from '@/components/home/home-category-card';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { ApiError, categoriesApi } from '@/lib/api';
import type { CategoryPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { textStyle, textAlignClass, isRtl } = useAppDirection();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const cats = await categoriesApi.list();
      setCategories(cats);
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

  const openCategory = (categoryId: string) => {
    router.push({
      pathname: '/(tabs)/companies',
      params: { categoryId },
    });
  };

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-dm-bg" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-dm-border">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-dm-elevated"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={20} color="#8E2157" />
        </Pressable>
        <Text
          className={cn('flex-1 text-lg font-bold text-ink dark:text-white', textAlignClass)}
          style={[{ fontFamily: getFontFamily('bold') }, textStyle]}
        >
          {t('categories.title')}
        </Text>
      </View>

      {error ? <Text className="px-4 py-3 text-center text-sm text-red-600">{error}</Text> : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {categories.length === 0 ? (
          <Text className="py-12 text-center text-sm text-ink-muted dark:text-white/70">
            {t('home.noCategories')}
          </Text>
        ) : (
          <View className="flex-row flex-wrap">
            {categories.map((category) => (
              <HomeCategoryCard
                key={category.id}
                category={category}
                onPress={() => openCategory(category.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
