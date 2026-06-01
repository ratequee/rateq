import { CompanyCard } from '@/components/company/company-card';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { ApiError, companiesApi } from '@/lib/api';
import type { CompanyPublic } from '@rateq/types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  RefreshControl,
  Text,
  View,
  Pressable,
  Keyboard,
} from 'react-native';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      setError(null);
      const params = new URLSearchParams({ sort: 'rating', limit: '20' });
      if (q) params.set('query', q);
      const result = await companiesApi.search(params);
      setCompanies(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }, [t]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  };

  const onSearch = () => {
    Keyboard.dismiss();
    setSearch(query);
    setLoading(true);
    void load(query).finally(() => setLoading(false));
  };

  if (loading && companies.length === 0) return <LoadingView />;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <Text className="text-2xl font-bold text-brand-700">{t('common.appName')}</Text>
        <View className="mt-3 flex-row gap-2">
          <Input
            className="flex-1"
            placeholder={t('common.searchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <Pressable
            onPress={onSearch}
            className="h-11 items-center justify-center rounded-lg bg-brand-600 px-4"
          >
            <Text className="font-semibold text-white">{t('common.search')}</Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <Text className="px-4 py-3 text-center text-sm text-red-600">{error}</Text>
      )}

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text className="py-12 text-center text-slate-500">{t('common.noResults')}</Text>
        }
        renderItem={({ item }) => <CompanyCard company={item} />}
      />
    </View>
  );
}
