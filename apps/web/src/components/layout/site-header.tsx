'use client';

import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { UserRole } from '@rateq/types';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = mobileOpen ? 'hidden' : '';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

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
          'fixed inset-0 z-[80] lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={cn(
            'flex min-h-dvh w-screen flex-col bg-[#171A22]/92 px-6 pb-10 pt-7 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[44px] font-medium leading-none tracking-tight text-white/55">{t('menu')}</p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={t('closeMenu')}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4 h-px w-full bg-white/20" />

          <div
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'mt-2 flex min-h-0 w-[82%] max-w-[330px] flex-1 -translate-x-full flex-col rounded-r-[34px] bg-white px-10 py-8 shadow-2xl transition-transform duration-300',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <Logo />

            <nav className="mt-12" aria-label={t('mainNav')}>
              {NAV_LINKS.map(({ href, key }) => (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block border-b border-slate-200 py-4 text-[18px] font-medium leading-[1.3] text-ink transition-colors hover:text-brand-500',
                    isActive(href) && 'text-brand-500',
                  )}
                >
                  {t(key)}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-4 pt-12">
              <Button variant="ghost" size="sm" onClick={switchLocale} className="w-full">
                <Globe className="h-4 w-4" />
                {locale === 'en' ? 'العربية' : 'English'}
              </Button>

              {!isLoading && !user && (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline-brand" className="h-12 w-full rounded-xl my-4">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="h-12 w-full rounded-xl">{t('getStarted')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
