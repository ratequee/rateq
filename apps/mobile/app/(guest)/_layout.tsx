import { GuestTabBar } from '@/components/navigation/guest-tab-bar';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function GuestTabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <GuestTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="map" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="companies" options={{ title: t('tabs.companies') }} />
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
    </Tabs>
  );
}
