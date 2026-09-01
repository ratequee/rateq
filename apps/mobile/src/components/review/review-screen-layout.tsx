import { useTheme } from '@/context/theme-context';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const THEME_COLORS = {
  light: { body: '#f8fafc', brand: '#8E2157' },
  dark: { body: '#323232', brand: '#8E2157' },
} as const;

interface ReviewScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ReviewScreenLayout({ title, subtitle, children }: ReviewScreenLayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRtl } = useAppDirection();
  const insets = useSafeAreaInsets();
  const { resolved } = useTheme();
  const palette = THEME_COLORS[resolved];

  return (
    <View className="flex-1" style={{ backgroundColor: palette.body }}>
      <View className="bg-brand-500">
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View className="flex-row items-center px-4 pb-1 pt-1">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              className="h-10 w-10 items-center justify-center rounded-xl"
            >
              <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={22} color="#ffffff" />
            </Pressable>
          </View>

          <View className="items-center px-6 pb-2 pt-2">
            <Text
              className="text-center text-2xl font-bold text-white"
              style={{ fontFamily: getFontFamily('bold'), lineHeight: 32 }}
            >
              {title}
            </Text>
            <Text
              className="mt-2 text-center text-sm leading-6 text-white/80"
              style={{ fontFamily: getFontFamily('regular') }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          </View>
        </SafeAreaView>

        <Svg width="100%" height={48} viewBox="0 0 400 48" preserveAspectRatio="none">
          <Path d="M0 0 H400 V16 C300 52 100 52 0 16 Z" fill={palette.brand} />
          <Path d="M0 16 C100 52 300 52 400 16 V48 H0 Z" fill={palette.body} />
        </Svg>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={{ marginTop: -24 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }}
        >
          <View className="w-full self-center">
            <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg dark:border-dm-border dark:bg-dm-surface dark:shadow-none">
              <View className="h-1.5 bg-gold-400" />
              <View className="px-5 py-6">{children}</View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
