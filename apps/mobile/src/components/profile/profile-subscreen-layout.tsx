import { getFontFamily } from '@/i18n';
import { useAppDirection } from '@/hooks/use-app-direction';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileSubscreenLayoutProps {
  title: string;
  children: ReactNode;
}

export function ProfileSubscreenLayout({ title, children }: ProfileSubscreenLayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRtl } = useAppDirection();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-dm-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3 dark:border-dm-border dark:bg-dm-surface">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-10 w-10 items-center justify-center rounded-xl"
        >
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={22} color="#8E2157" />
        </Pressable>
        <Text
          className="ms-2 flex-1 text-lg font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold') }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
