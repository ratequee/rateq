import { AppTabBar } from '@/components/navigation/app-tab-bar';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="map" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="companies" options={{ title: t('tabs.companies') }} />
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="activity" options={{ title: t('tabs.activity') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
