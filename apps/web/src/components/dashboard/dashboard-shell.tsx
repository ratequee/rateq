'use client';

import { DashboardLogoutButton, DashboardNav } from '@/components/dashboard/dashboard-nav';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserAccountMenu } from '@/components/layout/user-account-menu';
import { useAuth } from '@/components/providers/auth-provider';
import { useRequireVerifiedAuth } from '@/hooks/use-require-verified-auth';
import { useRouter } from '@/i18n/routing';
import { getDashboardSearchHref } from '@/lib/dashboard-search';
import { cn } from '@/lib/utils';
import { Menu, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
  role: 'admin' | 'company' | 'reviewer';
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const t = useTranslations('dashboardShell');
  const tNav = useTranslations('nav');
  const { logout } = useAuth();
  const router = useRouter();
  useRequireVerifiedAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    setMobileNavOpen(false);
    await logout();
    router.replace('/');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = getDashboardSearchHref(searchQuery);
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="surface-page min-h-screen">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label={tNav('closeMenu')}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex w-[280px] flex-col border-e border-default bg-white shadow-xl transition-transform duration-300 dark:bg-dm-surface lg:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
        aria-hidden={!mobileNavOpen}
      >
        <DashboardNav
          role={role}
          showClose
          onClose={() => setMobileNavOpen(false)}
          onNavigate={() => setMobileNavOpen(false)}
        />
        <div className="flex items-center justify-center gap-3 border-t border-default px-4 py-3 lg:hidden">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <DashboardLogoutButton onLogout={() => void handleLogout()} />
      </aside>

      <div className="flex min-h-screen flex-row">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-e border-default bg-white dark:bg-dm-surface lg:flex">
          <DashboardNav role={role} />
          <DashboardLogoutButton onLogout={() => void handleLogout()} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-default bg-white px-4 py-4 dark:bg-dm-surface sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-default text-ink-muted hover:bg-slate-50 dark:hover:bg-dm-elevated lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-expanded={mobileNavOpen}
                aria-label={tNav('openMenu')}
              >
                <Menu className="h-5 w-5" />
              </button>

              <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-md">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-default bg-slate-50 ps-10 pe-4 text-sm text-ink outline-none focus:border-brand-500 dark:bg-dm-elevated dark:text-slate-100"
                />
              </form>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleSwitcher />
              <ThemeToggle />
              <UserAccountMenu />
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
