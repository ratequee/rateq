import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { getFontFamily } from '@/i18n';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'gold' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(function Button(
  { title, variant = 'primary', size = 'md', loading, disabled, className, ...props },
  ref,
) {
  const variants = {
    primary: 'bg-brand-500 active:bg-brand-600',
    gold: 'bg-gold-400 active:bg-gold-500',
    outline:
      'border border-slate-200 bg-white active:bg-slate-50 dark:border-dm-border dark:bg-dm-elevated dark:active:bg-dm-hover',
    ghost: 'bg-transparent active:bg-slate-100 dark:active:bg-dm-hover',
  };

  const textVariants = {
    primary: 'text-white',
    gold: 'text-white',
    outline: 'text-ink dark:text-white',
    ghost: 'text-brand-500 dark:text-gold-300',
  };

  const sizes = {
    md: 'h-11 rounded-xl px-4',
    lg: 'h-12 rounded-xl px-5',
  };

  return (
    <Pressable
      ref={ref}
      className={cn(
        'flex-row items-center justify-center',
        sizes[size],
        variants[variant],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#8E2157' : '#fff'}
        />
      ) : (
        <Text
          className={cn('text-sm font-semibold', textVariants[variant])}
          style={{ fontFamily: getFontFamily('semibold') }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
});
