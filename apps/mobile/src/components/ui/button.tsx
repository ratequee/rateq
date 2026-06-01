import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-brand-600 active:bg-brand-700',
    outline: 'border border-slate-300 bg-white',
    ghost: 'bg-transparent',
  };

  const textVariants = {
    primary: 'text-white',
    outline: 'text-slate-800',
    ghost: 'text-brand-600',
  };

  return (
    <Pressable
      className={cn(
        'h-11 items-center justify-center rounded-lg px-4',
        variants[variant],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      <Text className={cn('text-sm font-semibold', textVariants[variant])}>
        {loading ? '...' : title}
      </Text>
    </Pressable>
  );
}
