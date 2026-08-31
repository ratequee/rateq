import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { getFontFamily } from '@/i18n';
import { changeLanguage, getCurrentLocale } from '@/i18n';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/cn';
import type { ThemePreference } from '@/lib/preferences';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

function OptionPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-xl border px-4 py-2.5',
        active
          ? 'border-brand-500 bg-brand-50 dark:border-gold-400 dark:bg-dm-hover'
          : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated',
      )}
    >
      <Text
        className={cn(
          'text-center text-sm font-semibold',
          active ? 'text-brand-600 dark:text-gold-300' : 'text-ink dark:text-white',
        )}
        style={{ fontFamily: getFontFamily('semibold') }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text
        className="text-sm font-medium text-ink-muted dark:text-white/75"
        style={{ fontFamily: getFontFamily('medium') }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  const locale = getCurrentLocale();

  return (
    <ProfileSubscreenLayout title={t('profile.settings.title')}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="gap-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-elevated">
          <SettingsRow label={t('profile.settings.language')}>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <OptionPill
                  active={locale === 'en'}
                  label={t('settings.english')}
                  onPress={() => void changeLanguage('en')}
                />
              </View>
              <View className="flex-1">
                <OptionPill
                  active={locale === 'ar'}
                  label={t('settings.arabic')}
                  onPress={() => void changeLanguage('ar')}
                />
              </View>
            </View>
          </SettingsRow>

          <SettingsRow label={t('profile.settings.appearance')}>
            <View className="flex-row gap-2">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <View key={theme} className="flex-1">
                  <OptionPill
                    active={preference === theme}
                    label={
                      theme === 'light'
                        ? t('settings.themeLight')
                        : theme === 'dark'
                          ? t('settings.themeDark')
                          : t('settings.themeSystem')
                    }
                    onPress={() => void setPreference(theme as ThemePreference)}
                  />
                </View>
              ))}
            </View>
          </SettingsRow>
        </View>
      </ScrollView>
    </ProfileSubscreenLayout>
  );
}
