'use client';

import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { UserRole } from '@rateq/types';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '/', key: 'home' as const },
  { href: '/about', key: 'about' as const },
  { href: '/categories', key: 'category' as const },
  { href: '/register', key: 'writeReview' as const },
  { href: '/contact', key: 'contact' as const },
];

export function SiteHeader() {
  const t = useTranslations('nav');
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => pathname === href;
  const switchLocale = () => {
    const next = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, { locale: next });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-gradient-to-b from-white via-white to-slate-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between md:gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Image src="/images/menu.svg" alt="Menu" width={20} height={20} />}
        </Button>
        <Link href="/" className="shrink-0 ml-[-40px] md:ml-0" onClick={() => setMobileOpen(false)}>
          <Logo />
          <span className="sr-only">{t('home')}</span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-ink-muted lg:flex"
          aria-label={t('mainNav')}
        >
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className={cn("transition-colors hover:text-brand-500 border-b-2 border-transparent hover:border-brand-500 pb-2", isActive(href) ? 'border-brand-500 text-brand-500' : 'border-transparent')}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={switchLocale}
            aria-label={t('switchLanguage')}
            className="hidden text-ink-muted sm:inline-flex"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{locale}</span>
          </Button>

          {!isLoading && (
            <>
              {user ? (
                <div className="hidden items-center gap-2 sm:flex">
                  {user.role === UserRole.COMPANY && (
                    <Link href="/dashboard/company">
                      <Button variant="ghost" size="sm">
                        {t('dashboard')}
                      </Button>
                    </Link>
                  )}
                  {user.role === UserRole.ADMIN && (
                    <Link href="/dashboard/admin">
                      <Button variant="ghost" size="sm">
                        {t('admin')}
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline-brand" size="sm" onClick={logout}>
                    {t('logout')}
                  </Button>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link href="/login">
                    <Button variant="outline-brand" size="sm" className="min-w-[90px]">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="min-w-[110px]">
                      {t('getStarted')}
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          'border-t border-slate-100 bg-white lg:hidden',
          mobileOpen ? 'block' : 'hidden',
        )}
      >
        <nav className="mx-auto max-w-page space-y-1 px-4 py-4 sm:px-6" aria-label={t('mainNav')}>
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn("block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-brand-50 hover:text-brand-500 pb-2", isActive(href) && 'text-brand-500')}
            >
              {t(key)}
            </Link>
          ))}

          <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" size="sm" onClick={switchLocale} className="flex-1">
              <Globe className="h-4 w-4" />
              {locale === 'en' ? 'العربية' : 'English'}
            </Button>
          </div>

          {!isLoading && !user && (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline-brand" className="w-full">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">{t('getStarted')}</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
