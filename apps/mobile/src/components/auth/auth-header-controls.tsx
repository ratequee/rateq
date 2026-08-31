import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/cn';
import { getFontFamily } from '@/i18n';

const LOCALE_LABELS = { en: 'EN', ar: 'AR' } as const;

export function AuthHeaderControls() {
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const isDark = resolved === 'dark';

  const pillBg = isDark ? 'bg-dm-elevated' : 'bg-white/15';
  const activePill = isDark ? 'bg-brand-500' : 'bg-white';
  const activeText = isDark ? 'text-white' : 'text-brand-500';
  const inactiveText = isDark ? 'text-white/80' : 'text-white/90';
  const iconColor = isDark ? '#f3f4f6' : '#ffffff';

  return (
    <View className="flex-row items-center gap-2">
      <View className={cn('flex-row rounded-full p-1', pillBg)}>
        {(['en', 'ar'] as const).map((code) => {
          const active = locale === code;
          return (
            <Pressable
              key={code}
              onPress={() => void changeLanguage(code)}
              className={cn('rounded-full px-3 py-1.5', active && activePill)}
            >
              <Text
                className={cn('text-xs font-semibold', active ? activeText : inactiveText)}
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
        className={cn('h-9 w-9 items-center justify-center rounded-full', pillBg)}
      >
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={iconColor} />
      </Pressable>
    </View>
  );
}
