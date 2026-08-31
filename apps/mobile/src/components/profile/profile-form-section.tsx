import { getFontFamily } from '@/i18n';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ProfileFormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  banner?: ReactNode;
}

export function ProfileFormSection({ title, subtitle, children, banner }: ProfileFormSectionProps) {
  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
      <Text
        className="text-base font-semibold text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('semibold') }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="mt-1 text-sm text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {subtitle}
        </Text>
      ) : null}
      {banner}
      <View className="mt-4 gap-4">{children}</View>
    </View>
  );
}
