import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { getFontFamily } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

export default function ProfileContactScreen() {
  const { t } = useTranslation();
  const email = t('profile.contact.emailValue');

  return (
    <ProfileSubscreenLayout title={t('profile.contact.title')}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dm-border dark:bg-dm-elevated">
          <Text
            className="text-sm leading-6 text-ink-muted dark:text-white/75"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('profile.contact.subtitle')}
          </Text>

          <View className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-dm-hover">
            <Text
              className="text-xs text-ink-muted dark:text-white/60"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('profile.contact.emailLabel')}
            </Text>
            <Pressable onPress={() => void Linking.openURL(`mailto:${email}`)}>
              <Text
                className="mt-1 text-base font-semibold text-brand-500"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {email}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ProfileSubscreenLayout>
  );
}
