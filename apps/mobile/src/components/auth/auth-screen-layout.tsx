import { Logo } from '@/components/brand/logo';
import { AuthHeaderControls } from '@/components/auth/auth-header-controls';
import { useTheme } from '@/context/theme-context';
import { getFontFamily } from '@/i18n';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const THEME_COLORS = {
  light: {
    body: '#f8fafc',
    brand: '#8E2157',
  },
  dark: {
    body: '#323232',
    brand: '#8E2157',
  },
} as const;

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScreenLayout({ title, subtitle, children, footer }: AuthScreenLayoutProps) {
  const { resolved } = useTheme();
  const insets = useSafeAreaInsets();
  const palette = THEME_COLORS[resolved];

  return (
    <View className="flex-1" style={{ backgroundColor: palette.body }}>
      <View className="bg-brand-500">
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View className="flex-row justify-end px-5 pb-2 pt-1" style={{ direction: 'ltr' }}>
            <AuthHeaderControls />
          </View>

          <View className="items-center px-6 pb-2 pt-4">
            <Logo variant="light" width={128} height={32} />
            <Text
              className="mt-6 text-center text-3xl font-bold text-white"
              style={{ fontFamily: getFontFamily('bold'), lineHeight: 36 }}
            >
              {title}
            </Text>
            <Text
              className="mt-2 text-center text-sm leading-6 text-white/80"
              style={{ fontFamily: getFontFamily('regular') }}
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
          <View className="w-full max-w-md self-center">
            <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg dark:border-dm-border dark:bg-dm-surface dark:shadow-none">
              <View className="h-1.5 bg-gold-400" />
              <View className="px-6 py-7">{children}</View>
              {footer ? (
                <View className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-dm-border dark:bg-dm-elevated/50">
                  {footer}
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
