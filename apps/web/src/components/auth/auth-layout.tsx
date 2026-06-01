'use client';

import { Logo } from '@/components/brand/logo';
import { Link } from '@/i18n/routing';
import { BadgeCheck, Star, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register';
}

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  const t = useTranslations('authPage');

  const highlights = [
    { icon: Star, text: t('highlight1') },
    { icon: BadgeCheck, text: t('highlight2') },
    { icon: Users, text: t('highlight3') },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(237,197,111,0.18),transparent_55%)]" />

        <div className="relative">
          <Link href="/">
            <Logo variant="light" className="text-2xl" />
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-wider text-gold-300">
            {variant === 'login' ? t('loginEyebrow') : t('registerEyebrow')}
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight xl:text-4xl">
            {variant === 'login' ? t('loginHeadline') : t('registerHeadline')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/85">
            {variant === 'login' ? t('loginSideText') : t('registerSideText')}
          </p>

          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5 text-gold-300" aria-hidden />
                </span>
                <span className="text-sm text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">{t('sideFooter')}</p>
      </div>

      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
