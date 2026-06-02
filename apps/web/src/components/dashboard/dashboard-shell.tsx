'use client';

import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import {
  Bell,
  Box,
  Database,
  Home,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

const NAV_ITEMS: {
  href: string;
  key: string;
  icon: typeof Home;
  roles: Array<'admin' | 'company' | 'reviewer'>;
}[] = [
  { href: '/dashboard/admin', key: 'home', icon: Home, roles: ['admin'] },
  { href: '/dashboard/reviewer', key: 'home', icon: Home, roles: ['reviewer'] },
  { href: '/dashboard/company', key: 'home', icon: Home, roles: ['company'] },
  { href: '#', key: 'products', icon: Box, roles: ['admin', 'company'] },
  { href: '#', key: 'categories', icon: LayoutGrid, roles: ['admin'] },
  { href: '#', key: 'inventory', icon: Database, roles: ['admin', 'company'] },
  { href: '#', key: 'orders', icon: ShoppingCart, roles: ['admin', 'company'] },
  { href: '#', key: 'shipping', icon: Truck, roles: ['admin', 'company'] },
  { href: '#', key: 'payments', icon: Wallet, roles: ['admin', 'company'] },
  { href: '#', key: 'reviews', icon: Star, roles: ['admin', 'reviewer', 'company'] },
  { href: '#', key: 'customers', icon: Users, roles: ['admin', 'company'] },
  { href: '#', key: 'settings', icon: Settings, roles: ['admin', 'company', 'reviewer'] },
] as const;

interface DashboardShellProps {
  children: ReactNode;
  role: 'admin' | 'company' | 'reviewer';
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const t = useTranslations('dashboardShell');
  const pathname = usePathname();
  const locale = useLocale();
  const { logout } = useAuth();
  const isRtl = locale === 'ar';

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <div className={cn('flex min-h-screen', isRtl ? 'flex-row-reverse' : 'flex-row')}>
        <aside className="hidden w-[280px] shrink-0 border-slate-200 bg-white lg:flex lg:flex-col ltr:border-r rtl:border-l">
          <div className="border-b border-slate-100 px-6 py-5">
            <Logo />
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navItems.map(({ href, key, icon: Icon }) => {
              const active = href !== '#' && pathname === href;
              return (
                <Link
                  key={`${href}-${key}`}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-500 text-white'
                      : 'text-ink-muted hover:bg-brand-50 hover:text-brand-500',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(`nav.${key}`)}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mx-4 mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-muted hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-4 text-sm outline-none focus:border-brand-500"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded-md bg-white px-2 py-0.5 text-xs text-ink-muted sm:inline">
                ⌘K
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-muted"
                aria-label={t('notifications')}
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-100">
                <img src="/images/author.svg" alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
