import { useAuth } from '@/context/auth-context';
import { useGuest } from '@/context/guest-context';
import { useTheme } from '@/context/theme-context';
import { changeLanguage, getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

const LOCALE_LABELS = { en: 'EN', ar: 'AR' } as const;

export function ScreenHeaderControls() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const { isGuest } = useGuest();
  const { resolved, toggle } = useTheme();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const isDark = resolved === 'dark';
  const iconColor = isDark ? '#e5e7eb' : '#64748b';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <View className="flex-row items-center gap-1.5">
      <View className="flex-row rounded-full bg-slate-100 p-0.5 dark:bg-dm-elevated">
        {(['en', 'ar'] as const).map((code) => {
          const active = locale === code;
          return (
            <Pressable
              key={code}
              onPress={() => void changeLanguage(code)}
              className={cn('rounded-full px-2.5 py-1', active && 'bg-white dark:bg-dm-surface')}
            >
              <Text
                className={cn(
                  'text-[11px] font-semibold',
                  active ? 'text-brand-500' : 'text-ink-muted dark:text-white/70',
                )}
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {LOCALE_LABELS[code]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.theme')}
        onPress={() => void toggle()}
        className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-dm-elevated"
      >
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color={iconColor} />
      </Pressable>

      {isGuest ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.login')}
          onPress={handleSignIn}
          className="h-8 items-center justify-center rounded-full bg-brand-500 px-3"
        >
          <Text
            className="text-[11px] font-semibold text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('auth.login')}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.logout')}
          onPress={() => void handleLogout()}
          className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-dm-elevated"
        >
          <Ionicons name="log-out-outline" size={16} color={iconColor} />
        </Pressable>
      )}
    </View>
  );
}
