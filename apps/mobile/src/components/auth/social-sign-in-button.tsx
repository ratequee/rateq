import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SocialSignInButtonProps extends Omit<PressableProps, 'children'> {
  loading?: boolean;
  children: ReactNode;
  accessibilityLabel: string;
}

export function SocialSignInButton({
  loading = false,
  children,
  accessibilityLabel,
  className,
  disabled,
  ...props
}: SocialSignInButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled || loading}
      className={cn(
        'h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white active:bg-slate-50 dark:border-dm-border dark:bg-dm-elevated dark:active:bg-dm-hover',
        (disabled || loading) && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? <ActivityIndicator color="#8E2157" /> : children}
    </Pressable>
  );
}
