import { getFontFamily } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export function ProfilePendingBanner() {
  const { t } = useTranslation();

  return (
    <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
      <Text
        className="text-sm text-amber-900 dark:text-amber-100"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('profile.edit.changesPending')}
      </Text>
    </View>
  );
}
