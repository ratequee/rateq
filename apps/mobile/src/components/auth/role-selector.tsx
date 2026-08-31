import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '@rateq/types';
import { cn } from '@/lib/cn';
import { getFontFamily } from '@/i18n';

interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  options: RoleOption[];
}

export function RoleSelector({ value, onChange, options }: RoleSelectorProps) {
  return (
    <View className="gap-3">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              'flex-row items-start gap-3 rounded-2xl border p-4',
              selected
                ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-dm-elevated'
                : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated',
            )}
          >
            <View
              className={cn(
                'mt-0.5 h-10 w-10 items-center justify-center rounded-xl',
                selected ? 'bg-brand-500' : 'bg-slate-100 dark:bg-dm-hover',
              )}
            >
              <Ionicons name={option.icon} size={20} color={selected ? '#ffffff' : '#6b7280'} />
            </View>
            <View className="flex-1">
              <Text
                className="text-base font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {option.label}
              </Text>
              <Text
                className="mt-1 text-sm leading-5 text-ink-muted dark:text-white/75"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {option.description}
              </Text>
            </View>
            <View
              className={cn(
                'mt-1 h-5 w-5 items-center justify-center rounded-full border',
                selected
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-slate-300 dark:border-dm-border',
              )}
            >
              {selected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export const REGISTER_ROLES = [UserRole.USER, UserRole.COMPANY] as const;
