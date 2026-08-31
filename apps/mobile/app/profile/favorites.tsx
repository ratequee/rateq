import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { FeaturedCompanyCard } from '@/components/home/featured-company-card';
import { LoadingView } from '@/components/ui/loading-view';
import { getFontFamily } from '@/i18n';
import { ApiError, companiesApi } from '@/lib/api';
import type { CompanyPublic } from '@rateq/types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Text } from 'react-native';

export default function ProfileFavoritesScreen() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await companiesApi.listFavorites();
      setCompanies(data);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingView />;

  return (
    <ProfileSubscreenLayout title={t('profile.favorites.title')}>
      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <Text
            className="py-12 text-center text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('profile.favorites.empty')}
          </Text>
        }
        renderItem={({ item }) => <FeaturedCompanyCard company={item} layout="list" />}
      />
    </ProfileSubscreenLayout>
  );
}
