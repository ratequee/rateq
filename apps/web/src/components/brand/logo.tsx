'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  /** `auto` switches to the white logo in dark mode (matches footer). */
  variant?: 'default' | 'light' | 'auto';
}

export function Logo({ className, variant = 'auto' }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const useLightLogo =
    variant === 'light' || (variant === 'auto' && mounted && resolvedTheme === 'dark');

  return (
    <Image
      src={useLightLogo ? '/images/white_logo.svg' : '/images/logo.svg'}
      alt="RateQ Logo"
      width={110}
      height={28}
      className={className}
      priority
    />
  );
}
