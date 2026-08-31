import { getFontFamily } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';

interface ProfileLogoutButtonProps {
  onPress: () => void;
}

export function ProfileLogoutButton({ onPress }: ProfileLogoutButtonProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      className="mt-2 items-center rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50 dark:border-red-900/50 dark:bg-dm-surface dark:active:bg-dm-hover"
    >
      <Text
        className="text-base font-semibold text-red-600 dark:text-red-400"
        style={{ fontFamily: getFontFamily('semibold') }}
      >
        {t('profile.logout')}
      </Text>
    </Pressable>
  );
}
