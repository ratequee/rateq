import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getFontFamily } from '@/i18n';

export function AuthDivider() {
  const { t } = useTranslation();

  return (
    <View className="my-6 flex-row items-center">
      <View className="h-px flex-1 bg-slate-200 dark:bg-dm-border" />
      <View className="mx-3 rounded-full bg-slate-100 px-3 py-1 dark:bg-dm-elevated">
        <Text
          className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('semibold') }}
        >
          {t('common.or')}
        </Text>
      </View>
      <View className="h-px flex-1 bg-slate-200 dark:bg-dm-border" />
    </View>
  );
}
