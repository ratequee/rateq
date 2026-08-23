'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from '@/i18n/routing';
import { useRequireVerifiedAuth } from '@/hooks/use-require-verified-auth';
import { getFirstAllowedAdminRoute } from '@/lib/admin-permissions';
import { hasAdminPermission, UserRole, type AdminPermission } from '@rateq/types';
import { useEffect, useMemo } from 'react';

export function useRequireAdmin(permission?: AdminPermission | AdminPermission[]): {
  ready: boolean;
  allowed: boolean;
} {
  const { user, isLoading, adminAccess, adminAccessLoading } = useAuth();
  const router = useRouter();
  useRequireVerifiedAuth();

  const permissions = adminAccess?.permissions?.length
    ? adminAccess.permissions
    : (user?.adminPermissions ?? []);

  const requiredKey = Array.isArray(permission) ? permission.join(',') : (permission ?? '');

  const required = useMemo(
    () => (requiredKey ? (requiredKey.split(',') as AdminPermission[]) : []),
    [requiredKey],
  );

  const ready = !isLoading && !adminAccessLoading && Boolean(user);
  const isAdmin =
    user?.role === UserRole.ADMIN && Boolean(adminAccess?.allowed || permissions.length);
  const hasRequired =
    required.length === 0 || required.some((item) => hasAdminPermission(permissions, item));
  const allowed = ready && isAdmin && hasRequired;

  useEffect(() => {
    if (!ready) return;

    if (!user || user.role !== UserRole.ADMIN || !isAdmin) {
      router.replace('/');
      return;
    }

    if (!hasRequired) {
      const fallback = getFirstAllowedAdminRoute({
        allowed: true,
        permissions,
      });
      router.replace(fallback ?? '/');
    }
  }, [ready, user, isAdmin, hasRequired, permissions, router]);

  return { ready, allowed };
}
