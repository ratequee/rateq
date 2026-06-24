'use client';

import { Logo } from '@/components/brand/logo';
import { AuthHeaderButtons, UserAccountMenu } from '@/components/layout/user-account-menu';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useProfile } from '@/components/providers/profile-provider';
import { canAccessDashboard, getDashboardPath } from '@/lib/profile-routing';

const NAV_LINKS = [
  { href: '/', key: 'home' as const },
  { href: '/about', key: 'about' as const },
  { href: '/blog', key: 'blog' as const },
  { href: '/categories', key: 'category' as const },
  { href: '/contact', key: 'contact' as const },
];

export function SiteHeader() {
  const t = useTranslations('nav');
  const { user, logout, isLoading, isFirebaseAdmin, firebaseAdminLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isActive = (href: string) => pathname === href;

  const profileBusy = profileLoading || firebaseAdminLoading;
  const dashboardEnabled =
    Boolean(user) &&
    !profileBusy &&
    user!.isVerified &&
    canAccessDashboard(user!, onboarding, isFirebaseAdmin);

  const handleMobileLogout = async () => {
    setMobileOpen(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/');
    } finally {
      setLoggingOut(false);
    }
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
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-gradient-to-b from-white via-white to-slate-50/80 backdrop-blur-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/80">
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
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Image src="/images/menu.svg" alt="Menu" width={20} height={20} />
          )}
        </Button>
        <Link href="/" className="shrink-0 md:ml-0" onClick={() => setMobileOpen(false)}>
          <Logo />
          <span className="sr-only">{t('home')}</span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-ink-muted dark:text-slate-400 lg:flex"
          aria-label={t('mainNav')}
        >
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                'transition-colors hover:text-brand-500 border-b-2 border-transparent hover:border-brand-500 pb-2',
                isActive(href)
                  ? 'border-brand-500 text-brand-500 dark:text-brand-300'
                  : 'border-transparent',
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LocaleSwitcher className="hidden sm:block" />

          {isLoading ? (
            <div
              className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700"
              aria-hidden
            />
          ) : user ? (
            <UserAccountMenu />
          ) : (
            <>
              <AuthHeaderButtons className="hidden sm:flex" />
              <Link href="/login" className="sm:hidden">
                <button
                  type="button"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {t('login')}
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          'fixed inset-0 z-[80] h-dvh overflow-hidden lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'flex h-full flex-col bg-[#171A22]/92 px-6 pb-4 pt-7 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <p className="text-3xl font-medium leading-none tracking-tight text-white/55 sm:text-[44px]">
              {t('menu')}
            </p>
          </div>
          <div className="mb-3 h-px w-full shrink-0 bg-white/20" />

          <div
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'flex min-h-0 w-[82%] max-w-[330px] flex-1 flex-col overflow-hidden rounded-r-[34px] bg-white shadow-2xl transition-transform duration-300',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <nav aria-label={t('mainNav')}>
                {NAV_LINKS.map(({ href, key }) => (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block border-b border-slate-200 py-3 text-[18px] font-medium leading-[1.3] text-ink transition-colors hover:text-brand-500',
                      isActive(href) && 'text-brand-500',
                    )}
                  >
                    {t(key)}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-3 pt-6">
                <ThemeToggle />
                <LocaleSwitcher variant="mobile" />

                {!isLoading && user && (
                  <>
                    {dashboardEnabled ? (
                      <Link
                        href={
                          isFirebaseAdmin ? '/dashboard/admin' : getDashboardPath(user, onboarding)
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button variant="outline-brand" className="h-11 w-full gap-2 rounded-xl">
                          <LayoutDashboard className="h-4 w-4" />
                          {t('dashboard')}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline-brand"
                        disabled
                        title={
                          !user.isVerified
                            ? t('dashboardDisabledUnverified')
                            : t('dashboardDisabledIncomplete')
                        }
                        className="h-11 w-full gap-2 rounded-xl opacity-60"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t('dashboard')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="h-11 w-full gap-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={loggingOut}
                      onClick={() => void handleMobileLogout()}
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? t('loggingOut') : t('logout')}
                    </Button>
                  </>
                )}

                {!isLoading && !user && (
                  <AuthHeaderButtons
                    className="flex w-full flex-col gap-3 sm:hidden"
                    onNavigate={() => setMobileOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
