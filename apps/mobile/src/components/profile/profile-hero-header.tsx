import { useTheme } from '@/context/theme-context';
import { getFontFamily } from '@/i18n';
import { useAppDirection } from '@/hooks/use-app-direction';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEME_COLORS = {
  light: {
    body: '#f8fafc',
    brand: '#8E2157',
    avatarRing: '#ffffff',
  },
  dark: {
    body: '#323232',
    brand: '#8E2157',
    avatarRing: '#323232',
  },
} as const;

interface ProfileHeroHeaderProps {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  showNotificationDot?: boolean;
  onEditPress?: () => void;
}

export function ProfileHeroHeader({
  displayName,
  email,
  avatarUrl,
  showNotificationDot = false,
  onEditPress,
}: ProfileHeroHeaderProps) {
  const { t } = useTranslation();
  const { isRtl } = useAppDirection();
  const { resolved } = useTheme();
  const insets = useSafeAreaInsets();
  const palette = THEME_COLORS[resolved];
  const initials = displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={{ backgroundColor: palette.body }}>
      <View className="bg-brand-500" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <Pressable
            onPress={onEditPress}
            accessibilityRole="button"
            accessibilityLabel={t('profile.editProfile')}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/15"
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
          </Pressable>

          <Text
            className="text-lg font-semibold text-white"
            style={{ fontFamily: getFontFamily('semibold'), lineHeight: 24 }}
          >
            {t('profile.screenTitle')}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.notifications')}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/15"
          >
            <Ionicons name="notifications-outline" size={20} color="#ffffff" />
            {showNotificationDot ? (
              <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-brand-500 bg-red-500" />
            ) : null}
          </Pressable>
        </View>

        <Svg width="100%" height={64} viewBox="0 0 400 64" preserveAspectRatio="none">
          <Path d="M0 0 H400 V24 C300 64 100 64 0 24 Z" fill={palette.brand} />
          <Path d="M0 24 C100 64 300 64 400 24 V64 H0 Z" fill={palette.body} />
        </Svg>
      </View>

      <View className="-mt-[4.5rem] items-center px-4 pb-5">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-28 w-28 rounded-full border-4 bg-white shadow-md dark:bg-dm-elevated"
            style={{ borderColor: palette.avatarRing }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="h-28 w-28 items-center justify-center rounded-full border-4 bg-brand-50 shadow-md dark:bg-dm-elevated"
            style={{ borderColor: palette.avatarRing }}
          >
            <Text
              className="text-4xl font-bold text-brand-500 dark:text-gold-300"
              style={{ fontFamily: getFontFamily('bold') }}
            >
              {initials}
            </Text>
          </View>
        )}

        <Text
          className="mt-4 text-center text-xl font-bold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('bold'), lineHeight: 28 }}
          numberOfLines={2}
        >
          {displayName}
        </Text>
        <Text
          className="mt-1 text-center text-sm text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular'), writingDirection: isRtl ? 'rtl' : 'ltr' }}
          numberOfLines={1}
        >
          {email}
        </Text>
      </View>
    </View>
  );
}
