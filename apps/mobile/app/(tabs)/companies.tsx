import { CategoryFilterChips } from '@/components/companies/category-filter-chips';
import { FeaturedCompanyCard } from '@/components/home/featured-company-card';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { ApiError, categoriesApi, companiesApi } from '@/lib/api';
import type { CategoryPublic, CompanyPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CompanySearchFilters {
  query?: string;
  categoryId?: string | null;
}

export default function CompaniesScreen() {
  const { t } = useTranslation();
  const { q, categoryId } = useLocalSearchParams<{ q?: string; categoryId?: string }>();
  const initialQuery = typeof q === 'string' ? q : '';
  const initialCategoryId =
    typeof categoryId === 'string' && categoryId.length > 0 ? categoryId : null;

  const [query, setQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(
    async ({ query: searchQuery, categoryId }: CompanySearchFilters) => {
      try {
        setError(null);
        const params = new URLSearchParams({ sort: 'rating', limit: '30' });
        const trimmed = searchQuery?.trim();
        if (trimmed) params.set('query', trimmed);
        if (categoryId) params.set('categoryId', categoryId);

        const result = await companiesApi.search(params);
        setCompanies(result.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('common.error'));
      }
    },
    [t],
  );

  useEffect(() => {
    void Promise.all([
      categoriesApi.list(),
      loadCompanies({ query: initialQuery, categoryId: initialCategoryId }),
    ])
      .then(([cats]) => setCategories(cats))
      .finally(() => setLoading(false));
  }, [initialQuery, initialCategoryId, loadCompanies]);

  useEffect(() => {
    if (typeof q === 'string' && q !== appliedQuery) {
      setQuery(q);
      setAppliedQuery(q);
    }
  }, [q, appliedQuery]);

  useEffect(() => {
    if (typeof categoryId === 'string' && categoryId.length > 0) {
      setSelectedCategoryId(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    if (loading) return;

    setFetching(true);
    void loadCompanies({ query: appliedQuery, categoryId: selectedCategoryId }).finally(() =>
      setFetching(false),
    );
  }, [appliedQuery, selectedCategoryId, loadCompanies, loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompanies({ query: appliedQuery, categoryId: selectedCategoryId });
    setRefreshing(false);
  };

  const onSearch = () => {
    Keyboard.dismiss();
    setAppliedQuery(query);
  };

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-dm-bg" edges={['top']}>
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-3 dark:border-dm-border dark:bg-dm-surface">
        <View className="flex-row items-center gap-2">
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

        <View className="mt-3">
          <CategoryFilterChips
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </View>

        {fetching ? (
          <View className="mt-2 items-center">
            <ActivityIndicator size="small" color="#8E2157" />
          </View>
        ) : null}
      </View>

      {error ? <Text className="px-4 py-3 text-center text-sm text-red-600">{error}</Text> : null}

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text className="py-12 text-center text-slate-500 dark:text-white/70">
            {t('common.noResults')}
          </Text>
        }
        renderItem={({ item }) => <FeaturedCompanyCard company={item} layout="list" />}
      />
    </SafeAreaView>
  );
}
