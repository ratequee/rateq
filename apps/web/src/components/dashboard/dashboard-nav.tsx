'use client';

import { Logo } from '@/components/brand/logo';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { AdminPermission, hasAdminPermission } from '@rateq/types';
import {
  Building2,
  FileText,
  FolderKanban,
  Globe,
  Home,
  LayoutGrid,
  LogOut,
  Settings,
  Shield,
  Star,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export const DASHBOARD_NAV_ITEMS: {
  href: string;
  key: string;
  icon: LucideIcon;
  roles: Array<'admin' | 'company' | 'reviewer'>;
  adminPermission?: AdminPermission;
}[] = [
  {
    href: '/dashboard/admin',
    key: 'home',
    icon: Home,
    roles: ['admin'],
    adminPermission: AdminPermission.STATS,
  },
  {
    href: '/dashboard/admin/companies',
    key: 'companyVerifications',
    icon: Building2,
    roles: ['admin'],
    adminPermission: AdminPermission.COMPANIES,
  },
  { href: '/dashboard/reviewer', key: 'home', icon: Home, roles: ['reviewer'] },
  { href: '/dashboard/company', key: 'home', icon: Home, roles: ['company'] },
  {
    href: '/dashboard/admin/directory',
    key: 'directory',
    icon: Users,
    roles: ['admin'],
    adminPermission: AdminPermission.DIRECTORY,
  },
  {
    href: '/dashboard/reviewer/reviews',
    key: 'reviews',
    icon: Star,
    roles: ['reviewer'],
  },
  {
    href: '/dashboard/company/reviews',
    key: 'reviews',
    icon: Star,
    roles: ['company'],
  },
  {
    href: '/dashboard/admin/projects',
    key: 'projects',
    icon: FolderKanban,
    roles: ['admin'],
    adminPermission: AdminPermission.MODERATION,
  },
  {
    href: '/dashboard/company/projects',
    key: 'projects',
    icon: FolderKanban,
    roles: ['company'],
  },
  {
    href: '/dashboard/admin/categories',
    key: 'categories',
    icon: LayoutGrid,
    roles: ['admin'],
    adminPermission: AdminPermission.CONTENT,
  },
  {
    href: '/dashboard/admin/blog',
    key: 'blog',
    icon: FileText,
    roles: ['admin'],
    adminPermission: AdminPermission.CONTENT,
  },
  {
    href: '/dashboard/admin/team',
    key: 'team',
    icon: Shield,
    roles: ['admin'],
    adminPermission: AdminPermission.TEAM,
  },
  { href: '/dashboard/admin/payments', key: 'payments', icon: Wallet, roles: ['admin'] },
  { href: '#', key: 'payments', icon: Wallet, roles: ['company'] },
  { href: '/dashboard/company/profile', key: 'settings', icon: Settings, roles: ['company'] },
  { href: '/dashboard/reviewer/profile', key: 'settings', icon: Settings, roles: ['reviewer'] },
  {
    href: '/search',
    key: 'visitCompanies',
    icon: Building2,
    roles: ['reviewer'],
  },
  {
    href: '/',
    key: 'viewSite',
    icon: Globe,
    roles: ['admin', 'company', 'reviewer'],
  },
];

const REVIEWER_NAV_KEYS = new Set(['home', 'reviews', 'settings', 'visitCompanies', 'viewSite']);
const HIDDEN_NAV_KEYS = new Set(['payments']);

export function getDashboardNavItems(
  role: 'admin' | 'company' | 'reviewer',
  adminPermissions: AdminPermission[] = [],
) {
  return DASHBOARD_NAV_ITEMS.filter((item) => {
    if (HIDDEN_NAV_KEYS.has(item.key)) return false;
    if (!item.roles.includes(role)) return false;
    if (role === 'admin' && item.adminPermission) {
      return hasAdminPermission(adminPermissions, item.adminPermission);
    }
    if (role === 'reviewer') return REVIEWER_NAV_KEYS.has(item.key);
    return true;
  });
}

interface DashboardNavProps {
  role: 'admin' | 'company' | 'reviewer';
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}

export function DashboardNav({ role, onNavigate, showClose, onClose }: DashboardNavProps) {
  const t = useTranslations('dashboardShell');
  const tNav = useTranslations('nav');
  const pathname = usePathname();
  const { adminAccess } = useAuth();
  const navItems = getDashboardNavItems(role, adminAccess?.permissions ?? []);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-subtle px-6 py-5">
        <Logo />
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dm-elevated dark:hover:text-white lg:hidden"
            aria-label={tNav('closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = href !== '#' && pathname === href;
          return (
            <Link
              key={`${href}-${key}`}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                active ? 'bg-brand-500 text-white' : 'dashboard-nav-link',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

interface DashboardLogoutButtonProps {
  onLogout: () => void;
}

export function DashboardLogoutButton({ onLogout }: DashboardLogoutButtonProps) {
  const t = useTranslations('dashboardShell');

  return (
    <div className="shrink-0 border-t border-subtle px-4 py-4">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-dm-elevated dark:hover:text-red-400"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {t('logout')}
      </button>
    </div>
  );
}
