import { ProfileHeroHeader } from '@/components/profile/profile-hero-header';
import { ProfileLogoutButton } from '@/components/profile/profile-logout-button';
import { ProfileMenuCard } from '@/components/profile/profile-menu-card';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { getProfileAvatarUrl, getProfileDisplayName } from '@/lib/profile-display';
import { getProfileMenuItems, type ProfileMenuItem } from '@/lib/profile-menu';
import { useAppToast } from '@/hooks/use-app-toast';
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { onboarding, isLoading } = useProfile();
  const toast = useAppToast();

  const handleMenuPress = useCallback(
    (item: ProfileMenuItem) => {
      const { action } = item;

      if (action.type === 'comingSoon') {
        toast.info(t('profile.comingSoon'), t('profile.screenTitle'));
        return;
      }

      if (action.type === 'tab') {
        router.push(action.href);
        return;
      }

      if (action.type === 'route') {
        router.push(action.href as Href);
        return;
      }
    },
    [router, t, toast],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/(auth)/login');
  }, [logout, router]);

  if (isLoading || !user) return <LoadingView />;

  const menuItems = getProfileMenuItems(user.role);
  const displayName = getProfileDisplayName(user, onboarding);
  const avatarUrl = getProfileAvatarUrl(user, onboarding);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-dm-bg">
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-dm-bg"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeroHeader
          displayName={displayName}
          email={user.email}
          avatarUrl={avatarUrl}
          showNotificationDot={!user.isVerified}
          onEditPress={() => router.push('/profile/information')}
        />

        <View className="px-4">
          {menuItems.map((item) => (
            <ProfileMenuCard
              key={item.id}
              icon={item.icon}
              titleKey={item.titleKey}
              subtitleKey={item.subtitleKey}
              onPress={() => handleMenuPress(item)}
            />
          ))}

          <ProfileLogoutButton onPress={() => void handleLogout()} />
        </View>
      </ScrollView>
    </View>
  );
}
