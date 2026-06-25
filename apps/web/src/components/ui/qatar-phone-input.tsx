'use client';

import { Input } from '@/components/ui/input';
import { QATAR_PHONE_PREFIX, sanitizeQatarPhoneDigits } from '@/lib/qatar-phone';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type QatarPhoneInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange?: (digits: string) => void;
};

export function QatarPhoneInput({
  value,
  onChange,
  className,
  disabled,
  readOnly,
  ...props
}: QatarPhoneInputProps) {
  const inputDisabled = disabled || readOnly;

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-md border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:border-slate-700 dark:focus-within:ring-brand-400',
        disabled && 'bg-slate-50 opacity-80 dark:bg-slate-900',
        props['aria-invalid'] && 'border-red-300 focus-within:ring-red-300',
      )}
    >
      <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-ink-muted dark:border-slate-700 dark:bg-slate-800 dark:text-white/85">
        {QATAR_PHONE_PREFIX}
      </span>
      <Input
        {...props}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={value}
        disabled={inputDisabled}
        readOnly={readOnly}
        onChange={(event) => onChange?.(sanitizeQatarPhoneDigits(event.target.value))}
        className={cn('h-11 border-0 bg-white focus-visible:ring-0 dark:bg-slate-900', className)}
      />
    </div>
  );
}
