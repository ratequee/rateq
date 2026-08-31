import { getFontFamily } from '@/i18n';
import { useAppDirection } from '@/hooks/use-app-direction';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

interface ProfileMenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  onPress: () => void;
}

export function ProfileMenuCard({ icon, titleKey, subtitleKey, onPress }: ProfileMenuCardProps) {
  const { t } = useTranslation();
  const { isRtl } = useAppDirection();

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm active:bg-brand-50 dark:border-dm-border dark:bg-dm-surface dark:active:bg-dm-hover"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-500 dark:bg-brand-500">
        <Ionicons name={icon} size={22} color="#ffffff" />
      </View>

      <View className="mx-3 min-w-0 flex-1">
        <Text
          className="text-base font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold'), lineHeight: 22 }}
          numberOfLines={1}
        >
          {t(titleKey)}
        </Text>
        <Text
          className="mt-0.5 text-sm text-ink-muted dark:text-white/65"
          style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
          numberOfLines={2}
        >
          {t(subtitleKey)}
        </Text>
      </View>

      <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={18} color="#9ca3af" />
    </Pressable>
  );
}
