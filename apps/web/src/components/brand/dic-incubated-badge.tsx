'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DicIncubatedBadgeProps {
  className?: string;
  /** Override theme: `light` = dark logo on light bg, `dark` = light logo on dark bg. */
  variant?: 'auto' | 'light' | 'dark';
}

/**
 * Digital Incubation Center “Incubated at” badge.
 * Uses the black artwork in light mode and the white artwork in dark mode.
 */
export function DicIncubatedBadge({ className, variant = 'auto' }: DicIncubatedBadgeProps) {
  const lightClass =
    variant === 'light' ? 'block' : variant === 'dark' ? 'hidden' : 'block dark:hidden';
  const darkClass =
    variant === 'dark' ? 'block' : variant === 'light' ? 'hidden' : 'hidden dark:block';

  return (
    <span className={cn('inline-flex items-center', className)}>
      <Image
        src="/images/dic-incubated-light.png"
        alt="Incubated at Digital Incubation Center — محتضن لدى حاضنة الأعمال الرقمية"
        width={220}
        height={87}
        className={cn('h-12 w-auto sm:h-14', lightClass)}
      />
      <Image
        src="/images/dic-incubated-dark.png"
        alt="Incubated at Digital Incubation Center — محتضن لدى حاضنة الأعمال الرقمية"
        width={220}
        height={87}
        className={cn('h-12 w-auto sm:h-14', darkClass)}
      />
    </span>
  );
}
