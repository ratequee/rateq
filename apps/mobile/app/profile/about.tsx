import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { Logo } from '@/components/brand/logo';
import { getFontFamily } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

export default function ProfileAboutScreen() {
  const { t } = useTranslation();

  return (
    <ProfileSubscreenLayout title={t('profile.about.title')}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="items-center rounded-2xl border border-slate-200 bg-white p-6 dark:border-dm-border dark:bg-dm-elevated">
          <Logo width={120} />
          <Text
            className="mt-5 text-center text-base leading-7 text-ink dark:text-white/90"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('profile.about.body')}
          </Text>
        </View>
      </ScrollView>
    </ProfileSubscreenLayout>
  );
}
