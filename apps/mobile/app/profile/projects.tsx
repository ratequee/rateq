import { CompanyProjectsPanel } from '@/components/profile/company-projects-panel';
import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@rateq/types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text } from 'react-native';

export default function ProfileProjectsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshToken((value) => value + 1);
  }, []);

  const handleRefreshEnd = useCallback(() => {
    setRefreshing(false);
  }, []);

  if (!user) return <LoadingView />;

  if (user.role !== UserRole.COMPANY) {
    return (
      <ProfileSubscreenLayout title={t('companyProjects.pageTitle')}>
        <Text className="p-4 text-sm text-ink-muted dark:text-white/70">
          {t('companyProjects.companyOnly')}
        </Text>
      </ProfileSubscreenLayout>
    );
  }

  return (
    <ProfileSubscreenLayout title={t('companyProjects.pageTitle')}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <CompanyProjectsPanel refreshToken={refreshToken} onRefreshEnd={handleRefreshEnd} />
      </ScrollView>
    </ProfileSubscreenLayout>
  );
}
