import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { Pressable, ScrollView, Text, View } from 'react-native';

export interface AdminFilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface AdminFilterChipsProps<T extends string> {
  options: AdminFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function AdminFilterChips<T extends string>({
  options,
  value,
  onChange,
}: AdminFilterChipsProps<T>) {
  return (
    <View className="border-b border-slate-100 dark:border-dm-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        {options.map((option) => {
          const active = option.value === value;
          const label =
            typeof option.count === 'number' ? `${option.label} (${option.count})` : option.label;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={cn(
                'h-8 items-center justify-center rounded-full px-3',
                active
                  ? 'bg-brand-500'
                  : 'border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated',
              )}
            >
              <Text
                className={cn('text-xs', active ? 'text-white' : 'text-ink dark:text-white')}
                style={{
                  fontFamily: getFontFamily(active ? 'semibold' : 'medium'),
                  lineHeight: 16,
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function AdminStatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'pending' | 'success' | 'danger';
}) {
  const bg =
    tone === 'pending'
      ? 'bg-amber-50 dark:bg-amber-950/50'
      : tone === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/50'
        : tone === 'danger'
          ? 'bg-red-50 dark:bg-red-950/40'
          : 'bg-slate-100 dark:bg-dm-elevated';

  const text =
    tone === 'pending'
      ? 'text-amber-700 dark:text-amber-300'
      : tone === 'success'
        ? 'text-emerald-700 dark:text-emerald-300'
        : tone === 'danger'
          ? 'text-red-700 dark:text-red-300'
          : 'text-ink-muted dark:text-white/70';

  return (
    <View className={cn('self-start rounded-full px-2 py-0.5', bg)}>
      <Text
        className={cn('text-[10px]', text)}
        style={{ fontFamily: getFontFamily('semibold'), lineHeight: 14 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
