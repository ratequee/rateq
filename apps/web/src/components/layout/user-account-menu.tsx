'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Link, useRouter } from '@/i18n/routing';
import { canAccessDashboard, getDashboardPath, getPostAuthRedirect } from '@/lib/profile-routing';
import { resolveAccountMenuDisplayName } from '@/lib/user-display-name';
import { cn } from '@/lib/utils';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface UserAccountMenuProps {
  className?: string;
  align?: 'start' | 'end';
}

export function UserAccountMenu({ className, align = 'end' }: UserAccountMenuProps) {
  const t = useTranslations('nav');
  const { user, logout, isFirebaseAdmin, firebaseAdminLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loading = profileLoading || firebaseAdminLoading;
  const dashboardEnabled =
    Boolean(user) &&
    !loading &&
    user!.isVerified &&
    canAccessDashboard(user!, onboarding, isFirebaseAdmin);

  const dashboardHref = user
    ? isFirebaseAdmin
      ? '/dashboard/admin'
      : dashboardEnabled
        ? getDashboardPath(user, onboarding)
        : getPostAuthRedirect(user, onboarding, isFirebaseAdmin)
    : '/login';

  const dashboardDisabledReason = !user?.isVerified
    ? t('dashboardDisabledUnverified')
    : t('dashboardDisabledIncomplete');

  const avatarUrl = onboarding?.reviewerProfile?.avatarUrl ?? null;

  const handleLogout = useCallback(async () => {
    setOpen(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/');
    } finally {
      setLoggingOut(false);
    }
  }, [logout, router]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const displayName = resolveAccountMenuDisplayName(user, onboarding);
  const initials = (displayName[0] ?? user.email[0] ?? '?').toUpperCase();

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-brand-50 ring-2 ring-transparent transition-shadow hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-brand-400"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={t('accountMenu')}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-brand-600">{initials}</span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute top-[calc(100%+8px)] z-[90] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg',
            align === 'end' ? 'end-0' : 'start-0',
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>

          {dashboardEnabled ? (
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {t('dashboard')}
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled
              title={dashboardDisabledReason}
              className="flex w-full cursor-not-allowed items-center gap-2 px-4 py-2.5 text-sm text-ink-muted opacity-60"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>{t('dashboard')}</span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {loggingOut ? t('loggingOut') : t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}

export function AuthHeaderButtons({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Link href="/login" onClick={onNavigate}>
        <button
          type="button"
          className="inline-flex h-9 min-w-[90px] items-center justify-center rounded-lg border border-brand-500 px-4 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-white/40 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          {t('login')}
        </button>
      </Link>
      <Link href="/register" onClick={onNavigate}>
        <button
          type="button"
          className="inline-flex h-9 min-w-[110px] items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {t('getStarted')}
        </button>
      </Link>
    </div>
  );
}
