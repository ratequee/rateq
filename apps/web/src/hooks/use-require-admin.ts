'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from '@/i18n/routing';
import { useRequireVerifiedAuth } from '@/hooks/use-require-verified-auth';
import { getFirstAllowedAdminRoute } from '@/lib/admin-permissions';
import { hasAdminPermission, UserRole, type AdminPermission } from '@rateq/types';
import { useEffect } from 'react';

export function useRequireAdmin(permission?: AdminPermission | AdminPermission[]): void {
  const { user, isLoading, adminAccess, adminAccessLoading } = useAuth();
  const router = useRouter();
  useRequireVerifiedAuth();

  useEffect(() => {
    if (isLoading || adminAccessLoading) return;

    if (!user || user.role !== UserRole.ADMIN || !adminAccess?.allowed) {
      router.replace('/');
      return;
    }

    const required =
      permission == null ? [] : Array.isArray(permission) ? permission : [permission];
    const allowed =
      required.length === 0 ||
      required.some((item) => hasAdminPermission(adminAccess.permissions, item));

    if (!allowed) {
      const fallback = getFirstAllowedAdminRoute(adminAccess);
      router.replace(fallback ?? '/');
    }
  }, [user, isLoading, adminAccess, adminAccessLoading, permission, router]);
}
